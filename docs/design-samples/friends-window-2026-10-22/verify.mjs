import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const base = process.env.SAMPLE_ORIGIN || 'http://localhost:5173';
const path = '/docs/design-samples/friends-window-2026-10-22/';
const output = fileURLToPath(new URL('.', import.meta.url));
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const page = await browser.newPage();
const errors = [];
const apiCalls = [];
const results = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(`${message.text()} (${message.location().url})`); });
page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) apiCalls.push(request.url()); });

async function open(variant, width = 390, height = 844) {
  await page.setViewportSize({ width, height });
  await page.goto(`${base}${path}preview.html?variant=${variant}`);
  await page.locator(variant === 'current' ? '.friends-row' : '.study-window').first().waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
  });
}
async function assertBounds(selector) {
  const rect = await page.locator(selector).boundingBox();
  const viewport = page.viewportSize();
  assert(rect && rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= viewport.width + 1 && rect.y + rect.height <= viewport.height + 1, `${selector} outside viewport`);
}

try {
  for (const variant of ['roster', 'cards', 'companion', 'current']) {
    for (const [width, height, label] of [[1200, 760, 'desktop'], [390, 844, 'mobile'], [360, 800, '360'], [320, 740, '320']]) {
      await open(variant, width, height);
      const metrics = await page.evaluate(() => ({
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        verticalOverflow: document.documentElement.scrollHeight > innerHeight,
        brokenAssets: [...document.images].filter(image => !image.naturalWidth).map(image => image.src)
      }));
      assert(!metrics.horizontalOverflow, `${variant} ${width}: horizontal overflow`);
      assert.equal(metrics.brokenAssets.length, 0, 'Broken asset');
      if (variant !== 'current') {
        assert(!metrics.verticalOverflow, `${variant} ${width}: page should not scroll`);
        await assertBounds('.study-window');
        if (variant === 'companion') await assertBounds('.companion-actions');
        const last = page.locator(variant === 'roster' ? '.roster-item' : variant === 'cards' ? '.club-card' : '.companion-row').last();
        await last.scrollIntoViewIfNeeded();
        const lastBounds = await last.boundingBox();
        assert(lastBounds.y + lastBounds.height <= height, 'Last friend must be reachable');
        await page.locator(variant === 'roster' ? '.study-roster' : variant === 'cards' ? '.study-cards' : '.companion-roster').evaluate(element => { element.scrollTop = 0; });
      }
      await page.screenshot({ path: `${output}${variant}-${label}.png` });
      results.push({ variant, width, height, ...metrics });
    }
    if (variant === 'current') continue;
    await open(variant);
    // Search remains global username lookup and can add someone outside the list.
    await page.getByRole('textbox', { name: '搜索用户名' }).fill('长离');
    await page.getByRole('button', { name: '搜索用户', exact: true }).click();
    await page.getByRole('dialog').waitFor();
    await page.getByRole('button', { name: '添加好友', exact: true }).click();
    assert.equal(await page.locator('dialog').count(), 0);
    await page.getByRole('textbox', { name: '搜索用户名' }).fill('不存在');
    await page.getByRole('button', { name: '搜索用户', exact: true }).click();
    assert.match(await page.getByRole('alert').textContent(), /没有这位用户/);
    await page.getByRole('textbox', { name: '搜索用户名' }).fill('');
    // Native dialog supports Escape and returns focus; the same real modes are reused.
    await page.locator('.study-primary:not(:disabled)').first().click();
    await page.getByRole('dialog', { name: '选择对弈模式' }).waitFor();
    assert.equal(await page.locator('.duel-options button').count(), 3);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').count(), 0);
    if (variant === 'companion') {
      await page.getByRole('button', { name: '秋日来信 对局中' }).click();
      assert(await page.locator('.companion-actions .study-primary').isDisabled());
    } else {
      assert.equal(await page.locator('.study-primary:disabled').count(), 4);
      await page.getByRole('button', { name: '小满的更多操作' }).click();
      await page.locator('.study-menu').getByRole('button', { name: '详细信息' }).click();
      await page.getByRole('dialog', { name: '详细信息' }).waitFor();
      await page.keyboard.press('Escape');
    }
    await page.getByRole('button', { name: '黑名单', exact: true }).click();
    if (variant === 'roster') await page.getByRole('button', { name: '解除', exact: true }).click();
    else await page.getByRole('button', { name: '从黑名单解除', exact: true }).click();
    await page.getByRole('button', { name: '取消', exact: true }).click();
    if (variant === 'roster') await page.getByRole('button', { name: '解除', exact: true }).click();
    else await page.getByRole('button', { name: '从黑名单解除', exact: true }).click();
    await page.getByRole('button', { name: '确认解除', exact: true }).click();
    assert.equal(await page.getByText('暂无黑名单', { exact: true }).count(), 1);
    await page.getByRole('button', { name: '关闭好友窗口' }).click();
    await page.getByRole('button', { name: '重新打开好友窗口' }).click();
    results.push({ variant, interactions: 'lookup, add, error, duel modes, escape, disabled state, profile, blacklist, cancel, remove, empty, reopen: passed' });
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(`${base}${path}`);
  for (const variant of ['cards', 'companion', 'current', 'roster']) {
    await page.locator(`[data-variant="${variant}"]`).click();
    await page.frameLocator('#preview').locator(variant === 'current' ? '.friends-row' : '.study-window').first().waitFor();
  }
  await page.locator('[data-size="390"]').click();
  assert.equal(Math.round((await page.locator('#preview').boundingBox()).width), 390);
  await page.getByRole('button', { name: '重置演示' }).click();
  await page.frameLocator('#preview').locator('.study-window').waitFor();
  assert.deepEqual(errors, []);
  assert.deepEqual(apiCalls, []);
  await writeFile(`${output}verification.json`, JSON.stringify({ passed: true, errors, apiCalls, results }, null, 2));
  console.log(`PASS: ${results.length} viewport/interaction checks; all gallery variants; no browser errors or API calls.`);
} finally {
  await browser.close();
}
