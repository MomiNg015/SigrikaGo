import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage();
for(const width of [1440,1920,390]) for(const context of ['self','social']) {
  await page.setViewportSize({width,height:900});
  await page.goto(`http://localhost:5175/.codex-run/summary-card.html?context=${context}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.profile-summary-item')).borderTopWidth==='2px');
  await page.waitForTimeout(300);
  const cards=await page.locator('.profile-summary-item').evaluateAll(es=>es.map(e=>{
    const r=e.getBoundingClientRect(),l=e.querySelector('.profile-summary-label').getBoundingClientRect(),v=e.querySelector('strong').getBoundingClientRect(),s=getComputedStyle(e),a=e.querySelector('button.profile-replay-button')?.getBoundingClientRect();
    return {width:r.width,labelY:l.y-r.y,valueY:v.y-r.y,labelX:l.x-r.x,valueX:v.x-r.x,font:getComputedStyle(e.querySelector('strong')).fontSize,padding:s.paddingLeft,overlap:a?l.right>a.left||v.right>a.left:false};
  }));
  if(width>768) for(const card of cards){for(const key of ['width','labelY','valueY','labelX','valueX'])assert.ok(Math.abs(card[key]-cards[0][key])<1,`${context} ${key} ${JSON.stringify(cards)}`);assert.equal(card.font,'25px');assert.equal(card.padding,'12px');assert.equal(card.overlap,false);}
  else for(const card of cards){assert.equal(card.font,'20px');assert.equal(card.padding,'8px');}
  console.log(width,context,cards);
  await page.locator('.profile-summary-grid').screenshot({path:`.codex-run/summary-${context}-${width}.png`});
}
await browser.close();
