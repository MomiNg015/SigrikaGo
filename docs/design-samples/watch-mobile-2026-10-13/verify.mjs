import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const base = 'http://localhost:5173/docs/design-samples/watch-mobile-2026-10-13/';
const errors = [];
const heights = {};
let count = 0;
try {
  for (const [width, height] of [[320, 568], [360, 800], [390, 844], [430, 915]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.url().includes('/api/')) errors.push(request.url()); });
    for (const view of ['split', 'versus', 'columns']) {
      let normalHeight;
      for (const state of ['', 'long', 'many', 'empty']) {
        await page.goto(`${base}preview.html?view=${view}&${state}`);
        await page.locator('.mw-window').waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
        await page.waitForTimeout(400);
        const result = await page.evaluate(() => {
          const shell = document.querySelector('.mw-window');
          const scroll = shell.querySelector('.mw-scroll');
          const names = [...shell.querySelectorAll('.user-identity-name')];
          const clippedNames = names.filter(name => {
            const range = document.createRange(); range.selectNodeContents(name);
            const owner = name.closest('.mw-player').getBoundingClientRect();
            return [...range.getClientRects()].some(rect => rect.left < owner.left - 1 || rect.right > owner.right + 1 || rect.bottom > owner.bottom + 1);
          }).map(name => name.textContent);
          return { height: shell.offsetHeight, rowHeight: shell.querySelector('.mw-row')?.offsetHeight,
            overflow: Math.max(document.documentElement.scrollWidth - innerWidth, scroll.scrollWidth - scroll.clientWidth),
            clippedNames,
            clippedCounts: [...shell.querySelectorAll('.room-move-placard')].some(node => node.scrollWidth > node.clientWidth + 1),
            peopleIcons: [...shell.querySelectorAll('.mw-people')].every(node => node.querySelector('svg') && node.getAttribute('aria-label').startsWith('房间人数 ')),
            readableNames: names.every(name => parseFloat(getComputedStyle(name).fontSize) >= 14 && getComputedStyle(name).whiteSpace === 'normal'),
            readableLabels: [...shell.querySelectorAll('.mw-code,.mw-status,.mw-stats')].every(node => parseFloat(getComputedStyle(node).fontSize) >= 12),
            actionTargets: [...shell.querySelectorAll('.mw-row-hit')].every(node => node.offsetWidth >= 44 && node.offsetHeight >= 44),
          };
        });
        assert.equal(await page.getByText('观战', { exact: true }).count(), 0);
        const label = `${view}/${width}/${state}`;
        assert.ok(result.overflow <= 1, `${label}: overflow ${result.overflow}`);
        assert.equal(result.clippedCounts, false, `${label}: count outside placard`);
        assert.ok(result.peopleIcons, `${label}: people icon/label`);
        assert.deepEqual(result.clippedNames, [], `${label}: clipped names`);
        assert.ok(result.readableNames && result.readableLabels && result.actionTargets, `${label}: readability or hit targets`);
        if (!state) { normalHeight = result.height; heights[`${view}-${width}`] = result.rowHeight; }
        assert.equal(result.height, normalHeight);
        if (state !== 'empty') {
          await page.locator('.mw-row-hit').last().scrollIntoViewIfNeeded();
          await page.locator('.mw-row-hit').last().click();
          await page.getByRole('button', { name: '打开观战窗口' }).click();
          await page.locator('.mw-window').waitFor();
        }
        if (!state) {
          await page.getByRole('button', { name: '刷新对局列表' }).click();
          await page.waitForFunction(() => document.querySelector('.mw-scroll').getAttribute('aria-busy') === 'false');
          assert.equal(await page.locator('.mw-row-hit[aria-pressed="true"]').count(), 0);
          const search = page.getByRole('textbox', { name: '搜索房间或玩家' });
          await search.fill('483126'); assert.equal(await page.locator('.mw-row').count(), 1);
          await search.fill('无结果'); assert.equal(await page.locator('.mw-row').count(), 0);
          await search.fill(''); assert.equal(await page.locator('.mw-row').count(), 7);
          await search.focus(); await page.keyboard.press('Tab');
          assert.ok(await page.locator('.mw-row-hit').first().evaluate(node => node === document.activeElement));
          for (const key of ['Enter', 'Space']) {
            await page.locator('.mw-row-hit').first().focus();
            await page.keyboard.press(key);
            await page.getByRole('button', { name: '打开观战窗口' }).click();
          }
          await page.getByRole('button', { name: '关闭对局列表' }).click();
          await page.getByRole('button', { name: '打开观战窗口' }).click();
          await page.waitForTimeout(400);
          if ([320, 390].includes(width)) await page.screenshot({ path: fileURLToPath(new URL(`${view}-${width}.png`, import.meta.url)) });
        }
        if (state === 'long' && width === 320) {
          await page.locator('.mw-scroll').evaluate(node => { node.scrollTop = 0; });
          await page.screenshot({ path: fileURLToPath(new URL(`${view}-long-320.png`, import.meta.url)) });
        }
        count++;
      }
    }
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: count, rowHeights: heights }));
} finally { await browser.close(); }
