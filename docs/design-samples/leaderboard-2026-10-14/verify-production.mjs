import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

// Run with an existing Playwright page; the preview isolates API calls locally.
export async function verifyProduction(page, base, directory) {
  const results = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 360, height: 640 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    for (const state of ['normal', 'long', 'tie', 'unranked', 'solo', 'duo', 'decorated', 'empty', 'loading', 'error']) {
      await page.goto(`${base}preview.html?view=current&state=${state}`);
      await page.getByRole('dialog').waitFor();
      await page.evaluate(() => document.fonts.ready);
      if (!['empty', 'loading', 'error'].includes(state)) await page.locator('.lp-winner').first().waitFor();
      const geometry = await page.evaluate(() => {
        const scroll = document.querySelector('.lp-scroll');
        const footer = document.querySelector('.lp-personal');
        return { pageOverflow: document.documentElement.scrollWidth > innerWidth, scrollOverflow: scroll ? scroll.scrollWidth > scroll.clientWidth + 1 : false, footerVisible: !footer || footer.getBoundingClientRect().bottom <= innerHeight, winners: document.querySelectorAll('.lp-winner').length };
      });
      assert.equal(geometry.pageOverflow, false, `${viewport.width}/${state}: page overflow`);
      assert.equal(geometry.scrollOverflow, false, `${viewport.width}/${state}: list overflow`);
      assert.equal(geometry.footerVisible, true, `${viewport.width}/${state}: footer`);
      if (state === 'solo' || state === 'duo') assert.equal(geometry.winners, state === 'solo' ? 1 : 2);
      if (state === 'tie') {
        assert.equal(geometry.winners, 3);
        assert.equal(await page.locator('.lp-winner').evaluateAll(nodes => nodes.map(node => node.dataset.rank).join(',')), '1,2,3');
        assert.equal(await page.locator('.lp-scroll > .lp-row').first().getAttribute('data-rank'), '4');
        await page.screenshot({ path: `${directory}/production-${viewport.width}-equal-scores.png` });
      }
      if (state === 'unranked') await page.getByText('未上榜', { exact: true }).waitFor();
      if (state === 'empty') await page.getByText('暂无排行', { exact: true }).waitFor();
      if (state === 'loading') await page.getByText('加载中...', { exact: true }).waitFor();
      if (state === 'error') await page.getByText('排行榜加载失败，请稍后重试', { exact: true }).waitFor();
      if (state === 'normal' || state === 'decorated') {
        await page.locator('.lp-avatar img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
        await page.screenshot({ path: `${directory}/production-${viewport.width}-${state}.png` });
      }
      if (state === 'normal') {
        assert.equal(await page.locator('.lp-scroll > .lp-row').first().getAttribute('data-rank'), '4');
        const positions = await page.locator('.lp-winner').evaluateAll(nodes => Object.fromEntries(nodes.map(node => [node.dataset.rank, node.getBoundingClientRect().x])));
        assert.ok(positions[2] < positions[1] && positions[1] < positions[3]);
        assert.equal(await page.locator('.lp-row .lp-record').first().isVisible(), viewport.width > 760);
        assert.equal(await page.locator('.lp-row .lp-wins').first().isVisible(), viewport.width <= 760);
        await page.locator('.lp-scroll').evaluate(node => { node.scrollTop = node.scrollHeight; });
        await page.locator('.lp-scroll > .lp-row').last().scrollIntoViewIfNeeded();
        for (const name of ['标准', '五子棋', '吃子赛']) {
          await page.getByRole('tab', { name, exact: true }).click();
          await page.locator('.lp-winner').first().waitFor();
        }
        assert.equal(await page.locator('.lp-capture .lp-metrics').count(), 0);
        assert.ok(await page.locator('.lp-captures').count() > 0);
        await page.screenshot({ path: `${directory}/production-${viewport.width}-capture.png` });
        await page.keyboard.press('Escape');
        await page.getByRole('button', { name: '打开排行榜', exact: true }).waitFor();
      }
      results.push({ viewport, state, ...geometry });
    }
  }
  assert.deepEqual(errors, []);
  await writeFile(`${directory}/production-verification.json`, JSON.stringify({ cases: results.length, errors, results }, null, 2));
  return { cases: results.length, errors };
}
