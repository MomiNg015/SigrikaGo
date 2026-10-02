import {chromium} from '@playwright/test';import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage();
for(const width of [1280,390])for(const context of ['self','social']){
await page.setViewportSize({width,height:844});await page.goto('http://localhost:5175/.codex-run/empty-card.html?context='+context,{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>{const e=document.querySelector('.profile-character-empty');return e&&getComputedStyle(e).display==='flex'&&getComputedStyle(e).borderTopWidth==='2px'});
const result=await page.locator('.profile-character-empty').evaluate(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect(),label=e.firstElementChild.getBoundingClientRect();return {height:r.height,border:s.borderTopWidth,bg:s.backgroundColor,shadow:s.boxShadow,text:e.textContent,table:!!e.querySelector('table'),centerError:Math.abs(r.left+r.width/2-label.left-label.width/2)}});
assert.equal(result.table,false);assert.equal(result.text,'暂无');assert.ok(result.height<80);assert.ok(result.centerError<1);assert.notEqual(result.shadow,'none');console.log(width,context,result);
await page.screenshot({path:'.codex-run/empty-card-'+context+'-'+width+'.png'});
}await browser.close();