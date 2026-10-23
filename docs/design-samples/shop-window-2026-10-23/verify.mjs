import { chromium } from 'playwright';
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = new URL('./', import.meta.url);
const base = process.env.SHOP_SAMPLE_URL || 'http://127.0.0.1:5173/docs/design-samples/shop-window-2026-10-23/';
const localChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ headless: true, ...(existsSync(localChrome) ? { executablePath: localChrome } : {}) });
const page = await browser.newPage();
const errors = [];
const layouts = [];
const interactions = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) errors.push('Unexpected API request'); });
try {
  for (const variant of ['a', 'b', 'c']) {
    for (const size of [{ width: 1440, height: 900, label: 'desktop' }, { width: 390, height: 844, label: 'mobile' }, { width: 320, height: 568, label: 'narrow' }]) {
      await page.setViewportSize(size);
      await page.goto(`${base}preview.html?variant=${variant}`);
      for (const store of ['goods', 'costumes']) {
        await page.locator(`[data-store="${store}"]`).click();
        await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode())); });
        const geometry = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          broken: [...document.images].filter(image => !image.naturalWidth).length,
          buttonHeights: [...document.querySelectorAll('.buy')].map(button => button.getBoundingClientRect().height),
          buttonFonts: [...document.querySelectorAll('.buy')].map(button => getComputedStyle(button).fontSize)
        }));
        assert.equal(geometry.overflow, false);
        assert.equal(geometry.broken, 0);
        assert.ok(geometry.buttonHeights.every(height => height >= 44));
        layouts.push({ variant, width: size.width, store, ...geometry });
        await page.screenshot({ path: fileURLToPath(new URL(`${variant}-${store === 'goods' ? size.label : `costume-${size.width}`}.png`, root)) });
        if (variant === 'a' && size.width < 600) {
          const last = page.locator('.product-card').last();
          await last.scrollIntoViewIfNeeded();
          const bottom = await last.boundingBox();
          assert.ok(bottom.y + bottom.height < size.height);
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}preview.html?variant=${variant}`);
    await page.locator('.buy').first().click();
    assert.equal(await page.locator('#balance').innerText(), '1270');
    await page.locator('[data-action="detail"]').first().click();
    assert.equal(await page.locator('#detail').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#detail').isVisible(), false);
    await page.locator('[data-store="costumes"]').click();
    await page.locator('.buy').first().click();
    assert.equal(await page.locator('#balance').innerText(), '670');
    assert.equal(await page.locator('.buy').first().innerText(), '已拥有');
    await page.locator('.refresh').click();
    assert.equal(await page.locator('.refresh').isDisabled(), true);
    await page.locator('.close').click();
    await page.locator('#reopen').click();
    assert.equal(await page.locator('#shop').isVisible(), true);
    await page.goto(`${base}preview.html?variant=${variant}&scenario=poor`);
    await page.locator('.buy').first().waitFor();
    assert.equal(await page.locator('.buy').first().isDisabled(), true);
    await page.goto(`${base}preview.html?variant=${variant}&scenario=mixed`);
    if (variant !== 'a') await page.locator('[data-action="select"][data-index="2"]').click();
    assert.equal(await page.getByRole('button', { name: '已售罄', exact: true }).isDisabled(), true);
    for (const store of ['goods', 'costumes']) {
      await page.goto(`${base}preview.html?variant=${variant}&scenario=empty`);
      await page.locator(`[data-store="${store}"]`).click();
      assert.equal(await page.locator('.empty').isVisible(), true);
      await page.screenshot({ path: fileURLToPath(new URL(`${variant}-empty-${store}.png`, root)) });
    }
    interactions.push({ variant, checks: ['wallet', 'detail', 'escape', 'costume purchase', 'owned', 'refresh cooldown', 'close/reopen', 'insufficient funds', 'sold-out', 'empty both stores'] });
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(base);
  await page.getByRole('button', { name: 'B · 选物图鉴 清单与大图联动' }).click();
  await page.frameLocator('#preview').locator('.catalog-list').waitFor();
  await page.getByRole('button', { name: '手机 390', exact: true }).click();
  assert.equal(Math.round((await page.locator('#preview').boundingBox()).width), 390);
  await page.locator('#scenario').selectOption('poor');
  await page.frameLocator('#preview').getByRole('button', { name: '金币不足', exact: true }).waitFor();
  assert.equal(await page.frameLocator('#preview').locator('.buy').first().isDisabled(), true);
  await page.getByRole('button', { name: 'A · 纸卡货架 一眼比较，轻松选购' }).click();
  await page.locator('#scenario').selectOption('normal');
  await page.getByRole('button', { name: '桌面', exact: true }).click();
  await page.frameLocator('#preview').locator('.product-card').first().waitFor();
  await page.screenshot({ path: fileURLToPath(new URL('comparison-page.png', root)), fullPage: true });
  assert.deepEqual(errors, []);
  writeFileSync(new URL('verification.json', root), JSON.stringify({ layouts, interactions, harness: 'variant/device/scenario controls passed', errors }, null, 2) + '\n');
  console.log(`Passed ${layouts.length} layout cases, ${interactions.length} interaction flows and comparison controls.`);
} finally { await browser.close(); }
