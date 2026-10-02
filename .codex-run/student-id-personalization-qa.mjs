import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage();
await page.goto('http://127.0.0.1:5173/.codex-run/student-id-preview.html');
console.log(await page.locator('.home-student-id-portrait img').evaluate(e=>({src:e.getAttribute('src'),css:getComputedStyle(e).cssText,rect:e.getBoundingClientRect().toJSON(),parent:e.parentElement.getBoundingClientRect().toJSON(),transform:getComputedStyle(e).transform,scale:getComputedStyle(e).scale,translate:getComputedStyle(e).translate})));
for (const width of [1440,390]) {
 await page.setViewportSize({width,height:900});
 await page.goto('http://127.0.0.1:5173/.codex-run/student-id-preview.html');
 for (const id of ['sigrika','denia','aemeath']) {
  await page.evaluate((id)=>window.renderStudentId({username:'Moming',achievementEquipmentAssets:{nameplate:{id:`reward-${id}-spark-100-wins-nameplate`,imageUrl:`/assets/achievements/${id==='sigrika'?'semantic-nameplate':id+'-spark-100-wins-nameplate'}.png`}}}),id);
  await page.waitForTimeout(250);
  console.log(width,id,await page.locator('.home-student-id').evaluate(e=>{const img=e.querySelector('.home-student-id-portrait img');const name=e.querySelector('.user-identity-name');const plate=e.querySelector('.user-identity-name-tag');return {portrait:{fit:getComputedStyle(img).objectFit,position:getComputedStyle(img).objectPosition,natural:[img.naturalWidth,img.naturalHeight]},font:getComputedStyle(name).fontSize,color:getComputedStyle(name).color,name:name.getBoundingClientRect().toJSON(),plate:plate.getBoundingClientRect().toJSON()};}));
  await page.locator('.home-student-id').screenshot({path:`.codex-run/student-id-personalized-${width}-${id}.png`});
 }
}
await browser.close();
