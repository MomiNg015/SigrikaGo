import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const page = await browser.newPage();
const phase = process.argv[2] || 'before';
for (const [width, height] of [[1440,900],[1920,1080],[2229,966],[360,800],[390,844],[412,915]]) {
  await page.setViewportSize({width,height});
  await page.goto('http://127.0.0.1:5173/.codex-run/student-id-preview.html');
  await page.locator('.home-student-id-shell').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  console.log(width, JSON.stringify(await page.evaluate(() => {
    const selectors = ['.home-main-panel','.home-stage','.home-student-id','.house-manual-entry','.home-match-feature'];
    return {overflow:document.documentElement.scrollWidth > innerWidth, boxes:selectors.map(s => {const e=document.querySelector(s);const c=getComputedStyle(e);return {s,...e.getBoundingClientRect().toJSON(),columns:c.gridTemplateColumns,rows:c.gridTemplateRows,padding:c.padding,transform:c.transform};})};
  })));
  await page.screenshot({path:`.codex-run/handbook-${phase}-${width}.png`,fullPage:true});
}
await page.setViewportSize({width:1920,height:1080});
await page.locator('.home-student-id').hover();
await page.waitForTimeout(350);
console.log('hover',await page.locator('.home-student-id').evaluate(e=>({transform:getComputedStyle(e).transform,origin:getComputedStyle(e).transformOrigin})));
await page.screenshot({path:`.codex-run/handbook-${phase}-hover.png`,fullPage:true});
await page.emulateMedia({reducedMotion:'reduce'});
console.log('reduced',await page.locator('.home-student-id').evaluate(e=>({transform:getComputedStyle(e).transform,transition:getComputedStyle(e).transitionDuration})));
await browser.close();
