import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base = process.env.LEADERBOARD_PREVIEW_URL || 'http://127.0.0.1:5173/docs/design-samples/leaderboard-2026-10-14/';
const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const errors = [];
const checks = [];
try {
  for (const width of [1440, 390, 360, 320]) {
    const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 1000 : width === 320 ? 568 : 844 } });
    page.on('pageerror', e => errors.push(e.message));
    for (const view of ['honor', 'podium', 'ledger']) {
      for (const state of ['normal', 'long', 'tie', 'unranked', 'empty', 'error', 'loading']) {
        await page.goto(`${base}preview.html?view=${view}&state=${state}`);
        await page.locator('.lb-window').waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
        const geometry = await page.evaluate(() => {
          const shell = document.querySelector('.lb-window').getBoundingClientRect();
          const scroll = document.querySelector('.lb-scroll');
          const footer = document.querySelector('.lb-personal')?.getBoundingClientRect();
          return { overflow: Math.max(document.documentElement.scrollWidth - innerWidth, scroll ? scroll.scrollWidth - scroll.clientWidth : 0), left: shell.left, right: shell.right, bottom: shell.bottom, footer: footer?.bottom || 0, innerHeight };
        });
        assert.ok(geometry.overflow <= 1, `${width}/${view}/${state}: horizontal overflow ${geometry.overflow}`);
        assert.ok(geometry.left >= 0 && geometry.right <= width && geometry.bottom <= geometry.innerHeight && geometry.footer <= geometry.innerHeight, 'Window and personal rank fit');
        if (state === 'normal') {
          if (view === 'podium' && width < 760) {
            assert.equal(await page.locator('.lb-row .lb-record:visible').count(), 0);
            assert.equal(await page.locator('.lb-row .lb-rate:visible').count(), 0);
            assert.deepEqual(await page.locator('.lb-personal .lb-mobile-stats small').allTextContents(), ['胜局', '胜率']);
            const alignment = await page.locator('.lb-personal .lb-row').evaluate(row => {
              const player = row.querySelector('.lb-mobile-player').getBoundingClientRect();
              const metrics = row.querySelector('.lb-mobile-stats').getBoundingClientRect();
              return Math.abs(player.y + player.height / 2 - metrics.y - metrics.height / 2);
            });
            assert.ok(alignment <= 1, 'Mobile identity and record share one horizontal row');
            assert.equal(await page.locator('.lb-personal .lb-avatar-place').textContent(), '7');
            assert.equal(await page.locator('.lb-personal .lb-compact-rank').getAttribute('aria-label'), '7段 2/8星');
            assert.equal(await page.locator('.lb-winner-detail, .lb-winner-select').count(), 0);
            assert.equal(await page.locator('.lb-winner .lb-mobile-stats:visible').count(), 3);
            assert.equal(await page.locator('.lb-winner').first().locator('.lb-mobile-stats b').first().textContent(), '184');
            assert.equal(await page.locator('.lb-scroll > .lb-row').first().getAttribute('aria-label'), '第4名 窗边的风');
          }
          if (view === 'podium' && width === 1440) {
            assert.equal(await page.locator('.lb-mobile-stats:visible').count(), 0);
            assert.equal(await page.locator('.lb-personal .lb-record > span:visible').count(), 4);
          }
          await page.screenshot({ path: fileURLToPath(new URL(`${view}-${width}.png`, import.meta.url)) });
          const scroll = page.locator('.lb-scroll');
          await scroll.evaluate(e => { e.scrollTop = e.scrollHeight; });
          await page.getByRole('tab', { name: '吃子赛', exact: true }).click();
          assert.ok(await page.locator('.lb-score').count() > 0);
          assert.equal(await page.locator('.lb-rate').count(), 0);
          await page.getByRole('tab', { name: '标准', exact: true }).click();
          await page.keyboard.press('ArrowDown');
          assert.equal(await page.getByRole('tab', { name: '五子棋', exact: true }).getAttribute('aria-selected'), 'true');
          await page.keyboard.press('Escape');
          await page.getByRole('button', { name: '打开排行榜' }).click();
          await page.getByRole('button', { name: '关闭排行榜' }).click();
          assert.equal(await page.locator('.lb-window').count(), 0);
        }
        if (state === 'unranked') assert.equal(await page.locator('.lb-unranked').textContent(), '未上榜');
        if (state === 'tie') assert.equal(await page.getByLabel('第2名', { exact: false }).count() + await page.locator('.lb-winner.winner-2').count(), 1);
        if (state === 'error') { await page.getByRole('button', { name: '重新加载' }).click(); assert.ok(await page.locator('.lb-row').count() > 0); }
        checks.push({ width, view, state, ...geometry });
      }
    }
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await page.goto(base);
  for (const name of ['2 领奖台', '3 竞技成绩单', '1 校园荣誉榜']) {
    await page.getByRole('button', { name, exact: true }).click();
    await page.frameLocator('iframe').locator('.lb-window').waitFor();
  }
  await page.locator('#size').selectOption('phone');
  assert.equal((await page.locator('iframe').boundingBox()).width, 390);
  await page.locator('#state').selectOption('empty');
  await page.frameLocator('iframe').getByText('暂无排行', { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  await writeFile(new URL('verification.json', import.meta.url), JSON.stringify({ cases: checks.length, errors, checks }, null, 2));
  console.log(`PASS: ${checks.length} viewport/view/state cases, mode switches, keyboard, close/reopen, comparison picker, image decoding.`);
} finally { await browser.close(); }
