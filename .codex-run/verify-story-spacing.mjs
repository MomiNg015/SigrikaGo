import {chromium} from '@playwright/test';import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage();
for(const [width,height,count] of [[1280,900,3],[1000,600,3],[390,844,3],[360,640,8],[1000,600,8]]){
await page.setViewportSize({width,height});await page.goto(`http://localhost:5175/.codex-run/story-spacing.html?count=${count}`,{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>{const b=document.querySelector('.onboarding-story-options button');return b&&getComputedStyle(b).borderTopWidth==='3px'});
const result=await page.evaluate(()=>{const modal=document.querySelector('.onboarding-story-modal'),options=document.querySelector('.onboarding-story-options');options.scrollTop=options.scrollHeight;const m=modal.getBoundingClientRect(),o=options.getBoundingClientRect(),buttons=[...options.querySelectorAll('button')],last=buttons.at(-1).getBoundingClientRect();return {bottomGap:m.bottom-last.bottom,optionsGap:m.bottom-o.bottom,padding:parseFloat(getComputedStyle(modal).paddingBottom),scroll:options.scrollHeight>options.clientHeight,rows:getComputedStyle(modal).gridTemplateRows}});
assert.ok(result.optionsGap>=result.padding,JSON.stringify(result));assert.ok(result.bottomGap>=result.padding,JSON.stringify(result));console.log(width,height,count,result);
if(count===3)await page.screenshot({path:`.codex-run/story-spacing-${width}.png`});
}
await browser.close();