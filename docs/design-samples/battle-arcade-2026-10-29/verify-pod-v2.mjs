import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('./', import.meta.url);
const url = 'http://127.0.0.1:8765/docs/design-samples/battle-arcade-2026-10-29/index.html';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage();
const errors = [];
const results = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
try {
  for (const width of [900, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const state of ['ready', 'waiting', 'spent', 'long']) {
      await page.goto(`${url}?scene&variant=pod&state=${state}`);
      await page.evaluate(() => document.fonts.ready);
      const visual = await page.evaluate(() => {
        const skill = document.querySelector('.skill');
        const face = skill.querySelector('.key-face');
        const title = skill.querySelector('.key-title');
        const badge = skill.querySelector('.use-count');
        const t = title.getBoundingClientRect();
        const b = badge.getBoundingClientRect();
        const f = face.getBoundingClientRect();
        return {
          text: title.textContent, gradient: getComputedStyle(face).backgroundImage,
          count: badge.textContent, font: getComputedStyle(badge).fontFamily,
          fontLoaded: document.fonts.check('20px "Sigrika Accent Latin"', '02'),
          badgeRight: b.right, faceRight: f.right, badgeBottom: b.bottom,
          titleTop: t.top, titleBottom: t.bottom, faceBottom: f.bottom,
          titleFits: title.scrollHeight <= title.clientHeight + 1 && title.scrollWidth <= title.clientWidth + 1,
          disabled: skill.disabled
        };
      });
      assert.notEqual(visual.text, '技能');
      assert.equal(visual.count, state === 'spent' ? '00' : '02');
      assert.equal(visual.gradient.includes('linear-gradient'), state !== 'spent');
      assert.equal(visual.disabled, ['waiting', 'spent'].includes(state));
      assert.match(visual.font, /Sigrika Accent Latin/);
      assert.match(visual.font, /IRIS Dotted Songti Circle/);
      assert.ok(visual.fontLoaded && visual.titleFits);
      assert.ok(visual.titleTop >= visual.badgeBottom && visual.titleBottom <= visual.faceBottom);
      assert.ok(visual.badgeRight <= visual.faceRight);
      await page.screenshot({ path: fileURLToPath(new URL(`pod-v2-${state}-${width}.png`, root)), fullPage: true });
      results.push({ width, state, ...visual });
    }
  }
  await page.goto(`${url}?scene&variant=pod`);
  // Measure visible downstroke for every control, not just the presence of :active CSS.
  for (const name of ['pass', 'count', 'skill', 'draw', 'resign']) {
    await page.mouse.move(0, 0);
    const button = page.locator(`.action.${name}`);
    const rect = await button.boundingBox();
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down();
    await page.waitForFunction(name => {
      const face = document.querySelector(`.action.${name} .key-face`);
      return new DOMMatrix(getComputedStyle(face).transform).m42 >= 1.9;
    }, name);
    await page.mouse.up();
    if (await page.locator('dialog').evaluate(el => el.open)) await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.is-pressed'));
    if (name === 'skill') await button.click();
  }
  // Cancellation cannot leave a cap stuck; keyboard has the same measurable press.
  await page.locator('.count').dispatchEvent('pointerdown');
  await page.locator('.count').dispatchEvent('pointercancel');
  assert.equal(await page.locator('.is-pressed').count(), 0);
  await page.locator('.draw').focus();
  await page.keyboard.down('Space');
  await page.waitForFunction(() => new DOMMatrix(getComputedStyle(document.querySelector('.draw .key-face')).transform).m42 >= 1.9);
  await page.keyboard.up('Space');
  await page.waitForFunction(() => !document.querySelector('.is-pressed'));
  const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await touch.goto(`${url}?scene&variant=pod`);
  await touch.locator('.skill').tap();
  assert.equal(await touch.locator('.skill').getAttribute('aria-pressed'), 'true');
  await touch.locator('.skill').tap();
  assert.equal(await touch.locator('.skill').getAttribute('aria-pressed'), 'false');
  await touch.close();
  assert.deepEqual(errors, []);
  await writeFile(new URL('verification-pod-v2.json', root), JSON.stringify({ results, presses: 'all five passed', pointerCancel: 'passed', keyboard: 'passed', touch: 'passed', errors }, null, 2));
  console.log('Passed 12 name/count/font/rainbow cases, 5 measured presses, cancel, keyboard and touch.');
} finally {
  await browser.close();
}
