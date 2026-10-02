import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage();
page.on('pageerror',e=>console.log('PAGEERROR',e.message));
for(const [width,height] of [[1440,900],[390,844],[360,640]]) {
  await page.setViewportSize({width,height});
  await page.goto('http://localhost:5173/.codex-run/opening-duel.html');
  await page.locator('.opening-duel').waitFor();
  await page.waitForTimeout(650);
  await page.screenshot({path:`.codex-run/opening-duel-${width}.png`});
  console.log(width,await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,portraits:[...document.querySelectorAll('.opening-duel img')].map(x=>({src:x.currentSrc,loaded:x.naturalWidth>0,rect:x.getBoundingClientRect().toJSON()})),text:document.querySelector('.opening-duel-copy').getBoundingClientRect().toJSON()})));
}
await browser.close();
