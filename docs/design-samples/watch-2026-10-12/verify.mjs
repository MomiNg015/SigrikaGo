import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const base = 'http://localhost:5173/docs/design-samples/watch-2026-10-12/';
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const errors = [];
let cases = 0;
try {
  for (const width of [1440, 390, 360, 320]) {
    const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 1000 : 844 } });
    page.on('pageerror', error => errors.push(error.message));
    for (const view of ['ledger', 'duel', 'ticket']) {
      let normalHeight;
      const prefix = view === 'ledger' ? 'wl' : 'wp';
      const shell = view === 'ledger' ? '.watch-ledger' : '.watch-prototype';
      for (const state of ['', 'long', 'many', 'empty']) {
        await page.goto(`${base}preview.html?view=${view}&${state}`);
        await page.locator(shell).waitFor();
        await page.waitForTimeout(400);
        await page.evaluate(() => document.fonts.ready);
        await page.locator(`${shell} img`).evaluateAll(images => Promise.all(images.map(image => image.decode())));
        const result = await page.evaluate(({ shell, prefix }) => {
          const modal = document.querySelector(shell);
          const scroll = document.querySelector(`.${prefix}-scroll`);
          return {
            height: modal.offsetHeight,
            overflow: Math.max(document.documentElement.scrollWidth - innerWidth, scroll.scrollWidth - scroll.clientWidth),
            modes: [...document.querySelectorAll(`.${prefix}-mode`)].map(e => e.textContent),
            tabs: modal.querySelectorAll('[role="tab"]').length,
            roundedSearch: getComputedStyle(modal.querySelector('input')).borderRadius,
            clippedData: [...modal.querySelectorAll(`.${prefix}-moves, .${prefix}-people, .${prefix}-mode`)].some(e => e.scrollWidth > e.clientWidth + 1),
          };
        }, { shell, prefix });
        assert.ok(result.overflow <= 1, `${view}/${width}/${state}: horizontal overflow ${result.overflow}`);
        assert.equal(result.tabs, 0);
        assert.equal(result.roundedSearch, '0px');
        if (view === 'ledger' && width < 769 && state !== 'empty') assert.ok((await page.locator('.wl-row').first().boundingBox()).height <= 116, 'Compact mobile row');
        assert.equal(result.clippedData, false, `${view}/${width}/${state}: data clipped`);
        if (!state) normalHeight = result.height;
        assert.equal(result.height, normalHeight);
        if (state !== 'empty') {
          assert.ok(['星炬', '标准', '五子棋', '队际赛'].every(mode => result.modes.includes(mode)));
          await page.locator(`.${prefix}-action button`).last().scrollIntoViewIfNeeded();
          await page.locator(`.${prefix}-action button`).last().click();
          if (view === 'ledger') {
            await page.getByRole('button', { name: '打开观战窗口' }).click();
            await page.locator(shell).waitFor();
            await page.waitForTimeout(400);
          } else assert.equal(await page.locator('.wp-action button[aria-pressed="true"]').count(), 1);
        }
        if (!state) {
          await page.getByRole('button', { name: '刷新对局列表' }).click();
          await page.waitForFunction(prefix => document.querySelector(`.${prefix}-scroll`).getAttribute('aria-busy') === 'false', prefix);
          assert.equal(await page.locator('.wp-action button[aria-pressed="true"]').count(), 0);
          const search = page.getByRole('textbox', { name: '搜索房间或玩家' });
          await search.fill('483126');
          assert.equal(await page.locator(`.${prefix}-row`).count(), 1);
          await search.fill('不存在的房间');
          assert.equal(await page.locator(`.${prefix}-row`).count(), 0);
          assert.equal(await page.locator(shell).evaluate(e => e.offsetHeight), normalHeight);
          await search.fill('');
          assert.equal(await page.locator(`.${prefix}-row`).count(), 7);
          await search.focus();
          await page.keyboard.press('Tab');
          assert.ok(await page.locator(`.${prefix}-action button`).first().evaluate(e => e === document.activeElement));
          await page.getByRole('button', { name: '关闭对局列表' }).click();
          await page.getByRole('button', { name: '打开观战窗口' }).click();
          await page.locator(shell).waitFor();
          await page.waitForTimeout(400);
          if ([1440, 390].includes(width)) await page.screenshot({ path: new URL(`${view}-${width}.png`, import.meta.url).pathname.replace(/^\/(\w:)/, '$1') });
        }
        cases++;
      }
    }
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(`${cases} layout/state cases passed; search, selection, refresh, keyboard and close/reopen passed.`);
} finally {
  await browser.close();
}
