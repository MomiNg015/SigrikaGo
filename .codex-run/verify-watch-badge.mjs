import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage();
page.on("pageerror",e=>console.log(e.message)); await page.route('**/api/rooms/watch?*',route=>route.fulfill({json:{rooms:[],roomCounts:{spark:9,standard:12,gomoku:99}}}));
for(const width of [1280,360,390,412]) {
 await page.setViewportSize({width,height:844});
 await page.goto('http://localhost:5174/.trellis/tasks/09-18-profile-empty-guide-actions/watch-preview.html');
 await page.locator('.watch-mode-count').first().waitFor({timeout:8000});
 const badges=await page.locator('.watch-mode-count').evaluateAll(nodes=>nodes.map(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height,shrink:getComputedStyle(n).flexShrink})));
 for(const badge of badges){assert.ok(Math.abs(badge.width-badge.height)<0.1);assert.equal(badge.shrink,'0');}
 console.log(width,JSON.stringify(badges));
 if(width===360)await page.screenshot({path:'.trellis/tasks/09-18-profile-empty-guide-actions/watch-360.png'});
}
await browser.close();


