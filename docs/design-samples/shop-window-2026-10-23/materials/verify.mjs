import { chromium } from 'playwright';
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = new URL('./', import.meta.url);
const base = process.env.SHOP_MATERIAL_URL || 'http://127.0.0.1:5173/docs/design-samples/shop-window-2026-10-23/materials/';
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
const page = await browser.newPage();
const errors = [], geometry = [], interactions = [];
page.on('pageerror', e => errors.push(e.message));
page.on('request', r => { if (new URL(r.url()).pathname.startsWith('/api/')) errors.push(`Unexpected network API: ${r.url()}`); });
const skins = ['velvet', 'ticket', 'enamel'];
async function ready() {
  await page.locator('.shop-window').waitFor();
  await page.locator('.shop-layout[data-catalog-state="ready"]').waitFor();
  await page.evaluate(async () => { document.querySelectorAll('img').forEach(e => { e.loading = 'eager'; }); await document.fonts.ready; });
  await page.waitForFunction(() => [...document.images].every(e => e.complete && e.naturalWidth > 0));
  await page.evaluate(async () => { await Promise.all([...document.images].map(e => e.decode())); });
}
async function settle() {
  await page.evaluate(async () => {
    for (let i = 0; i < 2; i++) {
      for (const a of document.getAnimations()) {
        const t = a.effect.getComputedTiming();
        a.pause(); a.currentTime = t.iterations === Infinity ? 0 : t.endTime;
      }
      await new Promise(requestAnimationFrame);
    }
  });
}
async function snapshot(store) {
  await settle();
  return page.evaluate(store => {
    const scope = store === 'zahira' ? '.zahira-store-page' : '.costume-store-page';
    const selectors = ['.shop-window', '.shop-header', '.shop-header h2', '.shop-refresh-button', '.shop-close-button', '.shop-header-balance',
      ...['.shop-card-position', '.shop-card-scale', '.shop-card-rotation', '.shop-card-float', '.shop-item', '.shop-product-stage', '.costume-shop-stage', '.shop-mascot-slot', '.costume-shop-mascot-slot', '.shop-mascot-bubble', '.costume-shop-bubble', '.shop-switch-button'].map(s => `${scope} ${s}`)];
    return selectors.flatMap(selector => [...document.querySelectorAll(selector)].map((e, index) => {
      const r = e.getBoundingClientRect(), s = getComputedStyle(e);
      return { selector, index, rect: [r.x, r.y, r.width, r.height].map(n => Math.round(n * 100) / 100), animation: [s.animationName, s.animationDuration, s.animationTimingFunction, s.animationIterationCount] };
    }));
  }, store);
}
async function shot(name) { await page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, root)), animations: 'disabled' }); }
try {
  for (const size of [{ width: 1440, height: 900, label: 'desktop' }, { width: 390, height: 844, label: 'mobile' }, { width: 320, height: 568, label: 'narrow' }]) {
    await page.setViewportSize(size);
    await page.goto(`${base}preview.html?skin=original`);
    await ready();
    for (const store of ['zahira', 'costume']) {
      if (store === 'costume') await page.locator('.zahira-to-costume').click();
      await page.locator('#shop-materials').evaluate(e => { e.dataset.skin = 'original'; });
      const baseline = await snapshot(store);
      await shot(`original-${store === 'zahira' ? '' : 'costume-'}${size.label}`);
      for (const skin of skins) {
        await page.locator('#shop-materials').evaluate((e, s) => { e.dataset.skin = s; }, skin);
        const candidate = await snapshot(store);
        assert.deepEqual(candidate, baseline, `${skin}/${store}/${size.width}: geometry or animations changed`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        geometry.push({ skin, store, viewport: `${size.width}x${size.height}`, comparedElements: baseline.length, geometryAndAnimationsUnchanged: true });
        await shot(`${skin}-${store === 'zahira' ? '' : 'costume-'}${size.label}`);
      }
    }
  }
  for (const skin of skins) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}preview.html?skin=${skin}`);
    await ready();
    await settle();
    const card = page.locator('.shop-item').filter({ hasText: '彩虹豆豆跳跳糖' });
    await card.locator('.shop-item-detail-trigger').click();
    await page.locator('.shop-item-detail-modal').waitFor();
    await page.locator('.shop-item-detail-modal .close-button').click();
    await card.locator('.primary-action').click();
    await page.waitForFunction(() => document.querySelector('.shop-header-balance-value').textContent === '1270');
    await page.locator('.zahira-to-costume').click();
    await settle();
    await page.locator('.costume-shop-card-trigger').first().click();
    await page.locator('.costume-detail-purchase-button').click();
    await page.locator('.costume-equip-prompt-modal').waitFor();
    await page.getByRole('button', { name: '立即装扮', exact: true }).click();
    await page.locator('.costume-equip-prompt-modal').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('.shop-header-balance-value').innerText(), '670');
    await page.waitForFunction(() => !document.querySelector('.shop-refresh-button').disabled);
    await page.locator('.shop-refresh-button').click();
    assert.equal(await page.locator('.shop-refresh-button').isDisabled(), true);
    await page.getByRole('button', { name: '关闭商店', exact: true }).click();
    await page.getByRole('button', { name: '重新打开商店', exact: true }).click();
    await page.locator('.shop-window').waitFor();
    await page.goto(`${base}preview.html?skin=${skin}&state=poor`);
    await ready();
    assert.equal(await page.locator('.shop-item').filter({ hasText: '彩虹豆豆跳跳糖' }).locator('.primary-action').isDisabled(), true);
    await shot(`${skin}-poor-mobile`);
    await page.goto(`${base}preview.html?skin=${skin}&state=long`);
    await ready();
    assert.match(await page.locator('.shop-mascot-bubble').innerText(), /请慢慢挑选/);
    await shot(`${skin}-long-mobile`);
    await page.goto(`${base}preview.html?skin=${skin}&state=empty`);
    await ready();
    assert.equal(await page.locator('.shop-item').count(), 0);
    await page.locator('.zahira-to-costume').click();
    assert.equal(await page.locator('.costume-shop-card-trigger').count(), 0);
    await shot(`${skin}-empty-mobile`);
    interactions.push({ skin, passed: ['item details', 'purchase wallet update', 'costume purchase and equip', 'refresh cooldown', 'close/reopen', 'insufficient funds', 'long dialogue', 'empty both stores'] });
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(base);
  const preview = page.frameLocator('#preview');
  await preview.locator('.shop-item').first().waitFor();
  await preview.locator('.zahira-to-costume').click();
  for (const skin of ['ticket', 'enamel']) {
    await page.locator(`[data-skin="${skin}"]`).click();
    await preview.locator(`#shop-materials[data-skin="${skin}"]`).waitFor();
    assert.equal(await preview.locator('.shop-header').getAttribute('data-store'), 'costume');
  }
  await page.locator('#original').click();
  await preview.locator('#shop-materials[data-skin="original"]').waitFor();
  assert.equal(await preview.locator('.shop-header').getAttribute('data-store'), 'costume');
  await page.locator('[data-width="390"]').click();
  assert.equal(Math.round((await page.locator('#preview').boundingBox()).width), 390);
  await page.locator('[data-skin="velvet"]').click();
  await page.locator('[data-width="desktop"]').click();
  await page.locator('#reset').click();
  await preview.locator('.shop-item').first().waitFor();
  await page.screenshot({ path: fileURLToPath(new URL('comparison-page.png', root)), fullPage: true, animations: 'disabled' });
  assert.deepEqual(errors, []);
  writeFileSync(new URL('verification.json', root), JSON.stringify({ geometry, interactions, harness: 'skin/original/device preserve current store; reset works', errors }, null, 2) + '\n');
  console.log(`Passed ${geometry.length} geometry/animation comparisons and ${interactions.length} interaction flows; no network API requests.`);
} finally { await browser.close(); }
