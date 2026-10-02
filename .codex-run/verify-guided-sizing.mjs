import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage();
for(const width of [1280,900,390,360]){
await page.setViewportSize({width,height:900});await page.goto('http://localhost:5175/.codex-run/guided-actual.html',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>{const b=document.querySelector('.tutorial-choice-actions button');return b&&getComputedStyle(b).borderTopWidth==='3px'});
for(const group of ['.onboarding-story-options','.tutorial-choice-actions']){
const sizes=await page.locator(group+' > button').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return {w:r.width,h:r.height,border:getComputedStyle(b).borderTopWidth}}));
const dimension=width>768?'h':'w';assert.ok(Math.max(...sizes.map(s=>s[dimension]))-Math.min(...sizes.map(s=>s[dimension]))<.2,JSON.stringify(sizes));assert.ok(sizes.every(s=>s.border==='3px'));console.log(width,group,JSON.stringify(sizes));
}
await page.screenshot({path:`.codex-run/guided-sizing-${width}.png`});
}
await browser.close();