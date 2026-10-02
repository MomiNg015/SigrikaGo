import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage();
page.on('pageerror',e=>console.log(e.message));
for(const [width,height] of [[2542,1180],[1920,1080],[1440,900],[390,844]]){
 await page.setViewportSize({width,height});
 await page.goto('http://localhost:5175/.codex-run/wide-home.html',{waitUntil:'domcontentloaded'});
 await page.locator('.home-student-id-zone').waitFor();

 const bounds=await page.evaluate(()=>Object.fromEntries(['.home-main-panel','.home-stage','.home-student-id-zone','.house-manual-entry','.home-match-feature','.home-utility-grid'].map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return [s,{x:r.x,y:r.y,w:r.width,h:r.height,offset:getComputedStyle(e).translate}]})));
 console.log(width,JSON.stringify(bounds));
 await page.screenshot({path:`.codex-run/wide-home-${process.argv[2]||'before'}-${width}.png`});
}
await browser.close();

