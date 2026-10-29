import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('./', import.meta.url);
const url = 'http://127.0.0.1:8765/docs/design-samples/battle-arcade-2026-10-29/index.html';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const failures = [];
const checks = [];
const page = await browser.newPage();
page.on('pageerror', error => failures.push(error.message));
page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
try {
  for (const variant of ['round', 'keys', 'pod']) {
    for (const width of [900, 390, 320]) {
      await page.setViewportSize({ width, height: width === 900 ? 720 : 844 });
      await page.goto(`${url}?scene&variant=${variant}`);
      await page.evaluate(() => document.fonts.ready);
      const geometry = await page.evaluate(() => ({
        width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth,
        buttons: [...document.querySelectorAll('.action')].map(button => {
          const r = button.getBoundingClientRect();
          return { name: button.dataset.action, width: r.width, height: r.height, left: r.left, right: r.right };
        }),
        fontLoaded: document.fonts.check('16px "Sigrika Window Title"')
      }));
      assert.equal(geometry.overflow, false, `${variant}/${width} horizontal overflow`);
      assert.equal(geometry.buttons.length, 5);
      assert.ok(geometry.fontLoaded);
      for (const button of geometry.buttons) {
        assert.ok(button.width >= 44 && button.height >= 44, `${variant}/${width}/${button.name} touch target`);
        assert.ok(button.left >= 0 && button.right <= width, `${variant}/${width}/${button.name} clipped`);
      }
      const area = name => { const b = geometry.buttons.find(b => b.name === name); return b.width * b.height; };
      assert.ok(area('skill') > area('count') && area('skill') > area('resign'));
      assert.ok(area('count') > area('pass') && area('resign') > area('draw'));
      await page.screenshot({ path: fileURLToPath(new URL(`${variant}-${width}.png`, root)), fullPage: true });
      await page.locator('.skill').click();
      await page.locator('.skill[aria-pressed=true]').waitFor();
      await page.locator('.skill').click();
      await page.locator('.skill[aria-pressed=false]').waitFor();
      await page.locator('.count').click();
      assert.match(await page.locator('.feedback').textContent(), /数目申请/);
      await page.locator('.draw').click();
      assert.match(await page.locator('.feedback').textContent(), /和棋申请/);
      await page.locator('.resign').click();
      assert.equal(await page.locator('dialog').evaluate(d => d.open), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.resign').evaluate(b => b === document.activeElement), true);
      await page.locator('.resign').click();
      await page.locator('dialog .confirm').click();
      await page.waitForFunction(() => document.querySelector('.feedback').textContent.includes('已认输'));
      assert.match(await page.locator('.feedback').textContent(), /已认输/);
      await page.locator('.pass').click();
      await page.locator('dialog .confirm').click();
      await page.waitForFunction(() => document.querySelector('.feedback').textContent.includes('已弃手'));
      assert.match(await page.locator('.feedback').textContent(), /已弃手/);
      for (const state of ['waiting', 'spent', 'long']) {
        await page.goto(`${url}?scene&variant=${variant}&state=${state}`);
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator('.skill').isDisabled(), state !== 'long');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        if (state === 'long' && width === 320) await page.screenshot({ path: fileURLToPath(new URL(`${variant}-long-320.png`, root)), fullPage: true });
      }
      checks.push({ variant, ...geometry, interactions: 'passed', states: 'passed' });
    }
  }
  // Preview controls and iframe synchronization, including narrow top-level pages.
  await page.setViewportSize({ width: 1440, height: 1240 });
  await page.goto(url);
  for (const variant of ['round', 'keys', 'pod']) {
    await page.locator(`[data-variant=${variant}]`).click();
    for (const id of ['desktop-frame', 'phone-frame']) await page.frameLocator(`#${id}`).locator(`.controls-shell.${variant}`).waitFor();
    for (const frame of page.frames()) await frame.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: fileURLToPath(new URL(`preview-${variant}.png`, root)), fullPage: true });
  }
  await page.locator('#state').selectOption('spent');
  for (const id of ['desktop-frame', 'phone-frame']) {
    await page.frameLocator(`#${id}`).locator('.skill:disabled').waitFor();
  }
  await page.locator('#reset').click();
  for (const id of ['desktop-frame', 'phone-frame']) await page.frameLocator(`#${id}`).locator('.skill:not(:disabled)').waitFor();
  await page.locator('#phone-width').selectOption('320');
  assert.equal(await page.locator('.phone-column').evaluate(el => el.getBoundingClientRect().width), 320);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(url);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${url}?scene&variant=keys`);
  assert.equal(await page.locator('.key-face').first().evaluate(el => getComputedStyle(el).transitionDuration), '0s');
  await page.locator('.skill').focus();
  await page.keyboard.press('Enter');
  await page.locator('.skill[aria-pressed=true]').waitFor();
  assert.deepEqual(failures, []);
  await writeFile(new URL('verification.json', root), JSON.stringify({ checks, preview: 'passed', reducedMotionAndKeyboard: 'passed', errors: failures }, null, 2));
  console.log(`Passed ${checks.length} viewport/variant cases, all action flows, 3 state cases each, preview controls, keyboard and reduced motion.`);
} finally {
  await browser.close();
}
