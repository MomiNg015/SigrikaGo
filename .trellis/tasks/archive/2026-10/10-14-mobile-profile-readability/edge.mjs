import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const b=await chromium.launch({headless:true,channel:'msedge'});
try { for(const plate of [false,true]) {
const p=await b.newPage({viewport:{width:320,height:640},reducedMotion:'reduce'});
await p.route('**/api/**',async r=>{
if(!new URL(r.request().url()).pathname.startsWith('/api/'))return r.continue();
const profile=await p.evaluate(()=>({...window.fixtureUser,username:'很长的围棋社玩家名字'}));
if(plate) profile.achievementEquipmentAssets={nameplate:{id:'reward-sigrika-spark-100-wins-nameplate',imageUrl:'/assets/achievements/semantic-nameplate.png'}};
await r.fulfill({json:{profile}});
});
await p.goto('http://127.0.0.1:5173/.codex-run/profile-folder-preview.html?context=self');
await p.locator('.profile-character-name').first().waitFor();
await p.evaluate(()=>document.fonts.ready);
await p.waitForTimeout(800);
const result=await p.locator('.profile-resume-hero').evaluate(e=>({scroll:e.scrollWidth,width:e.clientWidth,name:e.querySelector('.user-identity-name').textContent}));
assert.ok(result.scroll<=result.width);assert.equal(result.name,'很长的围棋社玩家名字');
await p.screenshot({path:'.trellis/tasks/10-14-mobile-profile-readability/edge-'+plate+'-320.png'});
console.log(plate,result);await p.close();
}} finally{await b.close();}
