import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const page = await browser.newPage();
try {
 for (const width of [1440, 390, 360]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('http://127.0.0.1:5173/.codex-run/profile-records-preview.html');
  await page.locator('.profile-record-metrics').waitFor();
  await page.evaluate(() => document.fonts.ready);
  const state = await page.evaluate(() => {
   const titles = [...document.querySelectorAll('.profile-summary-label')].map(e => {const c=getComputedStyle(e);return {font:c.fontFamily,size:c.fontSize,weight:c.fontWeight,line:c.lineHeight,color:c.color};});
   const metrics=[...document.querySelectorAll('.profile-record-metric')].map(e=>({label:e.querySelector('dt').textContent,width:e.clientWidth,scroll:e.scrollWidth}));
   return {titles,metrics,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  assert.deepEqual(state.titles[0],state.titles[1]);
  assert.deepEqual(state.metrics.map(e=>e.label),['总对局','胜','负','和','胜率']);
  assert.equal(state.overflow,false);
  assert.ok(state.metrics.every(e=>e.scroll<=e.width));
  console.log(width,JSON.stringify(state));
  await page.locator('.profile-summary-grid').screenshot({path:'.codex-run/profile-heading-'+width+'.png'});
 }
} finally {await browser.close();}
