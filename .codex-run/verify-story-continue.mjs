import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage();
for(const [width,height] of [[1280,900],[390,844]]){
  await page.setViewportSize({width,height});
  await page.goto('http://localhost:5175/.codex-run/story-spacing.html?count=0',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{const b=document.querySelector('.onboarding-story-single-action');return b&&getComputedStyle(b).borderTopWidth==='3px'&&getComputedStyle(b).maxWidth!=='280px'});
  const result=await page.evaluate(()=>{const b=document.querySelector('.onboarding-story-single-action'),r=b.getBoundingClientRect(),a=b.parentElement.getBoundingClientRect(),m=document.querySelector('.onboarding-story-modal').getBoundingClientRect();return {button:r.width,footer:a.width,left:r.left-a.left,gap:m.bottom-r.bottom,icon:!!b.querySelector("svg.lucide-play[aria-hidden=true]")}});
  assert.ok(Math.abs(result.button-result.footer)<.2);
  assert.ok(result.gap>=16);
  assert.ok(result.icon);
  console.log(width,result);
  await page.screenshot({path:'.codex-run/story-continue-'+width+'.png'});
}
await browser.close();
