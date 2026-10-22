import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { ESLint } from 'eslint';
import eslintConfig from '../../../eslint.config.js';

const out = fileURLToPath(new URL('.', import.meta.url));
const base = process.env.SAMPLE_ORIGIN || 'http://127.0.0.1:5173';
const route = '/docs/design-samples/handbook-paper-2026-10-22/';
const lint = new ESLint({ overrideConfigFile: true, overrideConfig: [{ ...eslintConfig[1], files: ['**/*.{js,jsx,mjs}'] }] });
const lintResults = await lint.lintFiles(['sample.jsx', 'gallery.js', 'verify.mjs'].map(name => out + name));
assert.deepEqual(lintResults.flatMap(result => result.messages), [], 'Sample ESLint');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage();
const errors = [], requests = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) requests.push(request.url()); });
async function settle() {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect?.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
}
async function open(view, width, height, extra = '') {
  await page.setViewportSize({ width, height });
  await page.goto(`${base}${route}preview.html?view=${view}${extra}`);
  await page.locator('.character-details-modal').waitFor();
  await settle();
}
async function layout(view, width, height, extra = '') {
  await open(view, width, height, extra);
  const state = await page.evaluate(() => {
    const modal = document.querySelector('.character-details-modal');
    const copy = document.querySelector('.character-detail-copy');
    const rect = modal.getBoundingClientRect();
    const names = ['.skill-title-row strong', '.skill-overclock-badge', '.character-cv-label', '.acquisition-method strong'];
    const labelStyles = names.map(q => { const el = document.querySelector(q); if (!el) return null; const s = getComputedStyle(el); return { q, radius: s.borderRadius, border: s.borderTopWidth, fill: s.backgroundColor }; }).filter(Boolean);
    const img = document.querySelector('.character-detail-figure img');
    const buttons = ['.character-costume-open-button', '.character-detail-fullbody > .close-button'].map(q => document.querySelector(q).getBoundingClientRect().toJSON());
    const music = document.querySelector('.character-music-player')?.getBoundingClientRect().toJSON();
    const name = document.querySelector('.character-detail-heading h3').getBoundingClientRect().toJSON();
    const art = document.querySelector('.character-detail-art').getBoundingClientRect().toJSON();
    const cv = document.querySelector('.character-cv-label');
    const derived = document.querySelector('.derived-skill-detail');
    const parentSkill = document.querySelector('.character-detail-copy > .character-skill-description');
    const stage = { grid: getComputedStyle(modal).backgroundImage, acquisition: getComputedStyle(document.querySelector('.acquisition-method')).display,
      cvUnderline: cv && getComputedStyle(cv).textDecorationLine, emblemWidth: parseFloat(getComputedStyle(document.querySelector('.character-detail-art'), '::after').width),
      derived: derived?.getBoundingClientRect().toJSON(), parentSkill: parentSkill.getBoundingClientRect().toJSON() };
    return { rect: rect.toJSON(), overflow: [modal.scrollWidth, modal.clientWidth, document.documentElement.scrollWidth], labels: labelStyles, imageLoaded: img.complete && img.naturalWidth > 0,
      font: parseFloat(getComputedStyle(document.querySelector('.character-skill-description')).fontSize), copy: [copy.clientWidth, copy.scrollWidth], buttons, music, name, art, stage };
  });
  assert(state.rect.left >= 0 && state.rect.right + 7 <= width + 1, `${view}/${width}: shell/shadow horizontal bounds`);
  assert(state.rect.top >= 0 && state.rect.bottom + 8 <= height + 1, `${view}/${width}: shell/shadow vertical bounds`);
  assert((view === 'spread' || state.overflow[0] <= state.overflow[1] + 1) && state.overflow[2] <= width, `${view}/${width}: overflow ${JSON.stringify(state)}`);
  assert(state.imageLoaded && state.font >= 16, `${view}/${width}: loaded art and readable prose`);
  for (const label of state.labels) assert(label.radius === '0px' && label.border === '0px' && label.fill === 'rgba(0, 0, 0, 0)', `${view}/${width}: no tag ${JSON.stringify(label)}`);
  const [wardrobe, close] = state.buttons;
  if (state.music) {
    const m = state.music;
    assert(Math.min(wardrobe.right, m.right) <= Math.max(wardrobe.left, m.left) || Math.min(wardrobe.bottom, m.bottom) <= Math.max(wardrobe.top, m.top), `${view}/${width}: music/wardrobe overlap`);
    assert(state.name.bottom <= m.top + 1 || state.name.right <= m.left + 1, `${view}/${width}: name/music overlap`);
    if (width <= 768 && view === 'banner') assert(m.bottom <= state.art.bottom + 1, `${view}/${width}: identity stays in hero`);
  }
  if (view === 'spread') {
    assert.equal(state.stage.acquisition, 'none', 'Stage removes acquisition');
    assert.equal(state.stage.cvUnderline, 'none', 'Stage CV has no underline');
    assert(state.stage.grid.includes('gradient') && state.stage.emblemWidth >= 280, 'Stage grid and large emblem');
    assert(Math.abs((close.left + close.right) / 2 - state.rect.right) <= 1 && Math.abs((close.top + close.bottom) / 2 - state.rect.top) <= 1, 'Close centered on paper corner');
    assert(close.left >= 0 && close.right + 5 <= width && close.top >= 0, 'Protruding close fits viewport');
    if (state.music) {
      assert(state.music.width >= 260 && state.music.bottom > state.rect.bottom && state.music.right > state.rect.right, 'Large radio crosses lower right corner');
      assert(state.music.left >= 0 && state.music.right + 5 <= width && state.music.bottom + 6 <= height, 'Protruding radio fits viewport');
    }
    if (width <= 768) {
      assert(state.name.left > state.art.left + state.art.width * .45 && state.name.bottom < state.art.bottom, 'Mobile name at lower right');
      const figure = await page.locator('.character-detail-figure').boundingBox();
      assert(figure.x + figure.width / 2 < state.art.left + state.art.width * .4, 'Mobile figure left');
      assert(wardrobe.right < state.name.left, 'Identity clears wardrobe');
      assert(Math.abs(wardrobe.width - wardrobe.height) < 1 && wardrobe.width >= 44, 'Mobile wardrobe is a square touch target');
      assert(wardrobe.left >= state.art.left + 8 && wardrobe.left <= state.art.left + 20 && wardrobe.bottom <= state.art.bottom - 8 && wardrobe.bottom >= state.art.bottom - 24, 'Mobile wardrobe sits inside art lower left');
    }
    if (state.stage.derived) assert(state.stage.derived.top < state.stage.parentSkill.bottom && state.stage.derived.left > state.stage.parentSkill.left, 'Derived card overlaps under parent');
  }
  assert(Math.min(wardrobe.right, close.right) <= Math.max(wardrobe.left, close.left) || Math.min(wardrobe.bottom, close.bottom) <= Math.max(wardrobe.top, close.top), `${view}/${width}: controls overlap`);
  const end = page.locator('.character-description');
  await end.scrollIntoViewIfNeeded();
  if (view === 'spread') {
    await page.locator('.character-detail-copy').evaluate(el => { el.scrollTop = el.scrollHeight; });
    const quote = await end.boundingBox();
    if (state.music) assert(quote.y + quote.height < state.music.top, 'Final text clears radio');
  }
  const reachable = await end.evaluate(el => { const r = el.getBoundingClientRect(); const m = el.closest('.character-details-modal').getBoundingClientRect(); return r.bottom <= m.bottom + 1 && r.top >= m.top - 1; });
  assert(reachable, `${view}/${width}: final text reachable`);
  checks.push({ view, width, height, extra, labels: 'no tag backgrounds/borders/radii', overflow: false, finalText: 'reachable', ...(view === 'spread' ? { stage: 'large cropped emblem, grid, corner close, larger floating radio, no acquisition/underline, left mobile figure, derived overlap, footer clearance' } : {}) });
  return state;
}
try {
  for (const view of ['spread', 'banner', 'reading']) {
    for (const [width, height] of [[1440, 900], [800, 900], [390, 844], [360, 640], [320, 568]]) {
      await layout(view, width, height);
      await open(view, width, height);
      if ([1440, 390, 320].includes(width)) await page.screenshot({ path: `${out}${view}-${width}.png` });
    }
    for (const extra of ['&character=aemeath', '&long', '&noMusic', '&unowned']) await layout(view, 320, 568, extra);
    await open(view, 1440, 900, '&character=aemeath');
    await page.screenshot({ path: `${out}${view}-aemeath.png` });
    if (view === 'spread') {
      await open(view, 390, 844, '&character=aemeath');
      await page.screenshot({ path: `${out}spread-aemeath-390.png` });
    }
    for (const width of [1440, 390]) {
      await open(view, width, width === 1440 ? 900 : 844);
      if (view === 'spread') {
        const closeButton = page.getByRole('button', { name: '关闭角色详情', exact: true });
        await page.mouse.move(0, 0);
        await closeButton.focus();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Shift+Tab');
        assert(await closeButton.evaluate(el => el === document.activeElement && el.matches(':focus-visible') && getComputedStyle(el).outlineStyle !== 'none'), 'Close retains keyboard focus feedback');
        await closeButton.hover();
        assert.equal(await closeButton.evaluate(el => getComputedStyle(el).outlineStyle), 'none', 'Close hover has no additional outer ring');
        const toggle = page.locator('.character-music-toggle');
        const colors = () => toggle.evaluate(el => ({ glyph: getComputedStyle(el.querySelector('.character-music-glyph')).color,
          fill: getComputedStyle(el).backgroundColor, ring: getComputedStyle(el, '::before').borderColor, ringShadow: getComputedStyle(el, '::before').boxShadow }));
        await page.mouse.move(0, 0);
        await settle();
        const restingColors = await colors();
        await toggle.hover();
        await settle();
        assert.deepEqual(await colors(), restingColors, 'Radio hover retains glyph and ring colors');
        await page.mouse.move(0, 0);
      }
      const token = page.locator('.skill-trait-token').first();
      await token.click();
      await page.locator('.skill-trait-popover').waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.skill-trait-popover').count(), 0);
      assert.equal(await page.locator('.character-details-modal').count(), 1);
      await page.locator('.character-music-title-trigger').click();
      await page.locator('.character-music-sheet').waitFor();
      const music = await page.locator('.character-music-sheet').boundingBox();
      assert(music.x >= 0 && music.x + music.width <= width + 1, `${view}: music sheet fits`);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.character-details-modal').count(), 1);
      await page.locator('.character-costume-open-button').click();
      await page.locator('.character-costume-dialog').waitFor();
      await settle();
      await page.getByRole('button', { name: '关闭服装列表', exact: true }).click();
      await page.locator('.character-costume-dialog').waitFor({ state: 'detached' });
      assert(await page.locator('.character-costume-open-button').evaluate(el => el === document.activeElement), 'Wardrobe restores focus');
      await page.getByRole('button', { name: '关闭角色详情', exact: true }).click();
      await page.getByRole('button', { name: '重新打开角色详情' }).click();
      await page.locator('.character-details-modal').waitFor();
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(view, 390, 844);
    assert.equal(await page.locator('.character-description').evaluate(el => getComputedStyle(el).transform), 'none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
  await page.goto(`${base}${route}`);
  await page.getByRole('button', { name: '3　漫画分镜', exact: true }).click();
  await page.getByRole('button', { name: '手机竖屏', exact: true }).click();
  assert((await page.locator('#preview').getAttribute('src')).includes('view=reading'));
  assert((await page.locator('#preview').getAttribute('class')).includes('phone'));
  await page.locator('#character').selectOption('aemeath');
  assert((await page.locator('#preview').getAttribute('src')).includes('character=aemeath'));
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  await writeFile(`${out}verification.json`, JSON.stringify({ checks, interactions: 'trait, music sheet, wardrobe focus return, close/reopen, gallery controls passed', errors, apiRequests: requests }, null, 2) + '\n');
  console.log(`${checks.length} layout cases and 6 desktop/mobile interaction flows passed; no API requests.`);
} catch (error) {
  console.error(JSON.stringify({ url: page.url(), errors, apiRequests: requests }));
  throw error;
} finally { await browser.close(); }
