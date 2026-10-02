import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage();
page.on('pageerror',e=>console.log(e.message));
for(const [width,height] of [[2542,1180],[1920,1080],[1440,900],[390,844]]){
 await page.setViewportSize({width,height});
 await page.goto('http://localhost:5173/.codex-run/wide-home.html',{waitUntil:'domcontentloaded'});
 await page.locator('.home-student-id-zone').waitFor(); await page.evaluate(async()=>{await Promise.all(Array.from(document.images).map(i=>i.decode().catch(()=>{})));});

 const bounds=await page.evaluate(()=>Object.fromEntries(['.home-main-panel','.home-stage','.home-student-id-zone','.house-manual-entry','.home-match-feature','.home-utility-grid'].map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return [s,{x:r.x,y:r.y,w:r.width,h:r.height,offset:getComputedStyle(e).translate}]})));
 console.log(width,JSON.stringify(bounds));
 await page.screenshot({path:`.codex-run/home-grid-${width}.png`});
}
await browser.close();



