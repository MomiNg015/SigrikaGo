import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage();
await page.route('**/api/users/qa-user/profile?*',route=>{const mode=new URL(route.request().url()).searchParams.get('mode');return route.fulfill({json:{profile:{id:'qa-user',username:'测试部员',characterId:'sigrika',rank:'18级',mode,characterStats:mode==='standard'?[{characterId:'sigrika',total:2,wins:1,losses:1,draws:0}]:[],recordStats:{totalGames:0,wins:0,losses:0,draws:0}}}});});
for(const [width,height] of [[1440,900],[1024,768],[390,844],[360,640]])for(const context of ['self','social','social&plain']){
await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:5182/.codex-run/profile-empty-fix.html?context='+context,{waitUntil:'domcontentloaded'});
await page.locator('.profile-character-empty').waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);
const result=await page.locator('.profile-character-empty').evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e),modal=e.closest('.profile-dossier-modal'),view=e.closest('.profile-resume-view'),m=modal.getBoundingClientRect(),v=view.getBoundingClientRect();return {height:r.height,border:s.borderTopWidth,bg:s.backgroundColor,frameBottom:r.bottom,modalBottom:m.bottom,viewBottom:v.bottom,viewHeight:v.height,overflow:document.documentElement.scrollWidth>innerWidth};});
assert.equal(result.border,'2px');assert.equal(result.overflow,false);assert.ok(result.height>=100);
await page.locator('.profile-character-empty').scrollIntoViewIfNeeded();
const visible=await page.locator('.profile-character-empty').evaluate(e=>{const r=e.getBoundingClientRect(),v=e.closest('.profile-resume-view').getBoundingClientRect();return r.bottom<=v.bottom+1;});
assert.ok(visible,`${width} ${context} bottom must be reachable`);
console.log(width,height,context,JSON.stringify(result));await page.screenshot({path:'.codex-run/profile-empty-fix-'+width+'-'+context.replace('&','-')+'.png'});
await page.getByRole('tab',{name:'标准',exact:true}).click();
await page.locator('.profile-character-table').waitFor();
await page.getByRole('tab',{name:'星炬',exact:true}).click();
await page.locator('.profile-character-empty').waitFor();
}await browser.close();