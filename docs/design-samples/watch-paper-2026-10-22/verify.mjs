import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { ESLint } from 'eslint';
import eslintConfig from '../../../eslint.config.js';
import { settleWindow } from '../../../tests/e2e/window-surfaces-fixture.js';

const base = process.env.SAMPLE_ORIGIN || 'http://127.0.0.1:5173';
const route = '/docs/design-samples/watch-paper-2026-10-22/';
const out = fileURLToPath(new URL('.', import.meta.url));
const lint = new ESLint({ overrideConfigFile: true, overrideConfig: [{ ...eslintConfig[1], files: ['**/*.{js,jsx,mjs}'] }] });
const lintResults = await lint.lintFiles(['sample.jsx', 'gallery.js', 'verify.mjs'].map(name => out + name));
assert.deepEqual(lintResults.flatMap(result => result.messages), [], 'Scoped ESLint');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage();
const errors = [], api = [], results = [];
function monitor(target) {
  target.on('pageerror', error => errors.push(error.message));
  target.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) api.push(request.url()); });
}
monitor(page);

async function open(width, height, query = '') {
  await page.setViewportSize({ width, height });
  await page.goto(`${base}${route}preview.html${query}`);
  await page.locator('.wl-scroll[aria-busy="false"]').waitFor();
  await settleWindow(page);
  await page.mouse.move(0, 0);
}
async function wholeCards(target = page) {
  // Whole-card positions can occur midway through a smooth scroll as well.
  // Wait for the final resting offset before asserting or capturing pixels.
  await target.evaluate(() => new Promise(resolve => {
    const list = document.querySelector('.wl-scroll');
    let previous = list.scrollTop, stableFrames = 0;
    function tick() {
      const current = list.scrollTop;
      stableFrames = Math.abs(current - previous) < .1 ? stableFrames + 1 : 0;
      previous = current;
      if (stableFrames >= 12) resolve();
      else requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }));
  await target.waitForFunction(() => {
    const list = document.querySelector('.wl-scroll');
    const bounds = list.getBoundingClientRect();
    const headHeight = list.querySelector('thead')?.getBoundingClientRect().height ?? 0;
    const rows = [...list.querySelectorAll('.wl-row')].map(row => row.getBoundingClientRect())
      .filter(row => row.bottom > bounds.top + headHeight + 1 && row.top < bounds.bottom - 1);
    return rows.length && rows.every(row => row.top >= bounds.top + headHeight + 1 && row.bottom + 4 <= bounds.bottom + 1);
  }, {}, { timeout: 4000 }).catch(async error => {
    const detail = JSON.stringify(await target.evaluate(() => {
      const list = document.querySelector('.wl-scroll');
      return { url:location.href, viewport:[innerWidth,innerHeight], list:list.getBoundingClientRect().toJSON(), scrollTop:list.scrollTop, rowHeight:list.style.getPropertyValue('--wl-row-height'), rows:[...list.querySelectorAll('.wl-row')].map(row => row.getBoundingClientRect().toJSON()) };
    }));
    throw new Error(`${error.message}\n${detail}`);
  });
}
async function scrollCheck(target = page) {
  await wholeCards(target);
  const list = target.locator('.wl-scroll');
  await list.hover();
  await target.mouse.wheel(0, 180);
  await target.mouse.move(0, 0);
  await target.waitForFunction(() => document.querySelector('.wl-scroll').scrollTop > 0);
  await wholeCards(target);
  await list.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await wholeCards(target);
  const last = await target.locator('.wl-row').last().boundingBox();
  const bounds = await list.boundingBox();
  assert(last.y >= bounds.y && last.y + last.height + 4 <= bounds.y + bounds.height + 1, 'Last card plus shadow visible');
  await list.evaluate(element => { element.scrollTop = 0; });
  await wholeCards(target);
}
async function geometry() {
  return page.evaluate(() => {
    const list = document.querySelector('.wl-scroll');
    const bounds = list.getBoundingClientRect();
    const problems = [];
    if (list.scrollWidth > list.clientWidth + 1) problems.push('Horizontal list overflow');
    for (const card of list.querySelectorAll('.wl-row')) {
      const rect = card.getBoundingClientRect();
      if (rect.left < bounds.left + 1 || rect.right + 4 > bounds.right + 1) problems.push('Clipped horizontal shadow');
      for (const cell of card.querySelectorAll('td:not(.wl-action)')) {
        const content = cell.getBoundingClientRect();
        if (content.right > rect.right || content.left < rect.left) problems.push('Cell outside card');
      }
    }
    const brokenImages = [...document.images].filter(img => !img.complete || img.naturalWidth === 0).length;
    const modal = document.querySelector('[role="dialog"]').getBoundingClientRect();
    return { width: innerWidth, height: innerHeight, cardHeight: list.querySelector('.wl-row')?.getBoundingClientRect().height, horizontalOverflow: document.documentElement.scrollWidth > innerWidth, modalInsideViewport: modal.left >= 0 && modal.right <= innerWidth && modal.bottom <= innerHeight, brokenImages, problems };
  });
}

try {
  for (const [width, height, query] of [[1440,900,''], [1024,768,''], [800,900,''], [390,844,''], [360,800,''], [320,740,''], [390,600,''], [320,740,'?long'], [390,844,'?many']]) {
    await open(width, height, query);
    await wholeCards();
    const result = await geometry();
    assert.deepEqual(result.problems, [], JSON.stringify(result));
    assert(!result.horizontalOverflow && result.modalInsideViewport && !result.brokenImages, JSON.stringify(result));
    results.push({ query, ...result });
    await scrollCheck();
    if (!query && [1440,390,320].includes(width)) await page.screenshot({ path: `${out}production-${width}${height === 600 ? '-short' : ''}.png` });
    if (query === '?long') await page.screenshot({ path: `${out}production-long.png` });
  }
  await open(390,844);
  const input = page.getByRole('textbox', { name: '搜索房间或玩家' });
  const frameStyle = () => page.locator('.wl-search').evaluate(element => {
    const style = getComputedStyle(element);
    return [style.border, style.boxShadow, style.outline];
  });
  const beforeFocus = await frameStyle();
  await input.focus();
  assert.deepEqual(await frameStyle(), beforeFocus, 'No focus border, glow or shadow change');
  assert.equal(await input.evaluate(element => getComputedStyle(element).outlineStyle), 'none');
  assert.equal(await page.locator('.wl-search button').count(), 0, 'No search button');
  for (const [query, count] of [['483',1], ['  白昼漫游  ',1], ['雨天的棉花糖',1], ['不存在的房间',0], ['',7]]) {
    await input.fill(query);
    assert.equal(await page.locator('.wl-row').count(), count, `Live query: ${query}`);
    if (count) await wholeCards();
    else assert(await page.getByText('未找到对局', { exact:true }).isVisible());
  }
  await page.getByRole('button', { name:'刷新对局列表' }).click();
  assert(await page.getByRole('button', { name:'刷新对局列表' }).isDisabled());
  await page.locator('.wl-scroll[aria-busy="false"]').waitFor();
  await page.getByRole('button', { name:'观战房间 483126' }).click();
  assert(await page.getByText('观战入口预览 · 房间 483126').isVisible());
  await page.getByRole('button', { name:'重新打开观战窗口' }).click();
  await page.locator('.wl-row').first().waitFor();
  await wholeCards();
  await input.focus();
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);

  await open(1440,900);
  const first = page.locator('.wl-row').first();
  const neutral = await first.evaluate(element => getComputedStyle(element, '::before').boxShadow);
  await first.hover();
  await settleWindow(page);
  assert.notEqual(await first.evaluate(element => getComputedStyle(element, '::before').boxShadow), neutral, 'Hover shadow');
  await page.mouse.down();
  await settleWindow(page);
  assert((await first.evaluate(element => getComputedStyle(element, '::before').boxShadow)).includes('1px 1px'), 'Pressed shadow');
  await page.mouse.move(0,0);
  await page.mouse.up();
  await open(1440,900);
  await page.emulateMedia({ reducedMotion:'reduce' });
  assert((await first.evaluate(element => getComputedStyle(element, '::before').transitionDuration.split(',').every(value => parseFloat(value) <= .001))), 'No perceptible reduced-motion transition');
  await page.emulateMedia({ reducedMotion:'no-preference' });
  await open(390,844,'?empty');
  assert(await page.getByText('暂无对局', { exact:true }).isVisible());
  await open(390,844,'?error');
  assert(await page.getByRole('alert').isVisible());
  assert(await page.getByText('加载失败', { exact:true }).isVisible());
  await open(1440,900,'?finished');
  const ended = page.locator('.wl-row.finished').first();
  const endedFill = () => ended.evaluate(element => getComputedStyle(element, '::before').backgroundColor);
  const gray = await endedFill();
  const [red,green,blue] = await ended.evaluate(element => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    context.fillStyle = getComputedStyle(element, '::before').backgroundColor;
    context.fillRect(0,0,1,1);
    return [...context.getImageData(0,0,1,1).data];
  });
  assert(red === green && green === blue && red < 240 && red > 180, 'Finished card uses a light neutral gray');
  const statusChannels = await ended.locator('.wl-status > span').evaluate(element => getComputedStyle(element).color.match(/[\d.]+/g).slice(0,3).map(Number));
  const luminance = channels => channels.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((total,value,index) => total + value * [.2126,.7152,.0722][index],0);
  assert((luminance([red,green,blue]) + .05) / (luminance(statusChannels) + .05) >= 4.5, 'Ended status text stays readable against gray');
  await ended.hover(); await settleWindow(page);
  assert.equal(await endedFill(), gray, 'Finished card stays gray on hover');
  await page.mouse.down(); await settleWindow(page);
  assert.equal(await endedFill(), gray, 'Finished card stays gray when pressed');
  await page.mouse.up();
  assert(await page.getByText('观战入口预览 · 房间 750129').isVisible(), 'Finished room remains actionable');
  for (const width of [1440,390]) {
    await open(width, width === 390 ? 844 : 900, '?finished');
    await wholeCards();
    await page.screenshot({ path:`${out}production-finished-${width}.png` });
  }

  const phone = await browser.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
  const touch = await phone.newPage();
  monitor(touch);
  await touch.goto(`${base}${route}preview.html?many`);
  await touch.locator('.wl-row').first().waitFor();
  await settleWindow(touch);
  await wholeCards(touch);
  const bounds = await touch.locator('.wl-scroll').boundingBox();
  const client = await phone.newCDPSession(touch);
  const x = bounds.x + bounds.width / 2, y = bounds.y + bounds.height * .8;
  await client.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{x,y}] });
  for (let step=1;step<=8;step++) {
    await client.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{x,y:y-step*30}] });
    await touch.waitForTimeout(20);
  }
  await client.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
  await touch.waitForFunction(() => document.querySelector('.wl-scroll').scrollTop > 0);
  await wholeCards(touch);
  await touch.screenshot({ path:`${out}production-touch-scrolled.png` });
  await phone.close();
  await page.goto(`${base}${route}`);
  await page.locator('#phone').click();
  assert(await page.locator('#preview').evaluate(element => element.classList.contains('phone')));
  await page.getByRole('button', { name:'结束状态', exact:true }).click();
  assert((await page.locator('#preview').getAttribute('src')).includes('?finished'));
  await page.getByRole('button', { name:'全部对局', exact:true }).click();
  await page.getByRole('button', { name:'重置', exact:true }).click();
  assert.deepEqual(errors, []);
  assert.deepEqual(api, [], 'No real API requests');
  await writeFile(`${out}verification.json`, JSON.stringify({ results, liveSearch:'pass', focus:'unchanged', finishedBackground:'neutral gray on idle, hover and press; room remains actionable', interactions:'refresh, join preview, reopen, Escape, hover, press, reduced motion passed', scrolling:'whole cards at rest, wheel, touch, last row and resize passed', errors, apiRequests:api }, null, 2)+'\n');
  console.log(`${results.length} viewport/state checks passed; live search, whole-card scrolling and interactions passed; no API requests.`);
} finally { await browser.close(); }
