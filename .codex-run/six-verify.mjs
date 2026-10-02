import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {RECRUITMENT_ITEMS} from '../src/shared/recruitment.js';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage();
const players=Array.from({length:4},(_,i)=>({id:String(i),username:i===2?'WWWWWWWW':'星焰一号',commonCharacter:'sigrika',characterId:'sigrika',rank:'3段',rating:1800-i*37,totalGames:50,wins:30,losses:20,status:'online'}));
const items=Object.values(RECRUITMENT_ITEMS).map((v,i)=>({...v,id:String(i),itemId:v.itemType,quantity:3,category:'item',finalPrice:120,purchasable:true}));
await page.route('http://127.0.0.1:5178/api/**',r=>{const u=r.request().url();let data={items};if(u.includes('leaderboard'))data={players};if(u.includes('/social'))data={friends:players,blacklist:[]};if(u.includes('achievement-equipment'))data={assets:[{id:'x',type:'title',name:'围棋部新星'}],equipment:{},equipmentAssets:{}};return r.fulfill({json:data});});
async function visit(url){await page.goto('http://127.0.0.1:5178/'+url,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);}
for(const width of [1440,390,360]) {
 await page.setViewportSize({width,height:width>768?900:844});
 for(const view of ['shop','friends','leaderboard']) {
  await visit('.codex-run/audit-a.html?view='+view);
  if(view==='shop'&&width<769){const result=await page.locator('.shop-mascot-bubble').evaluate(e=>{e.textContent='你的心声像晨鸟一样热闹……是有什么，悄悄锁住你的目光了吗？';const r=e.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);const t=range.getBoundingClientRect();return {height:r.height,top:t.top-r.top,bottom:r.bottom-t.bottom};});assert.ok(result.height>70&&result.top>=10&&result.bottom>=20,JSON.stringify(result));}
  if(view==='friends'&&width>768){const gap=await page.locator('.friends-row').first().evaluate(e=>e.querySelector('.user-identity').getBoundingClientRect().left-e.querySelector('img').getBoundingClientRect().right);assert.ok(gap<25&&gap>=0,'friend gap '+gap);}
  if(view==='leaderboard'&&width===360){const dimensions=await page.locator('.leaderboard-player').nth(2).evaluate(e=>{const n=e.querySelector('.user-identity-name'),m=e.querySelector('.user-identity-main');return {clipped:n.scrollWidth>n.clientWidth,contained:m.clientWidth<=e.clientWidth};});assert.ok(dimensions.clipped&&dimensions.contained,JSON.stringify(dimensions));}
  if(view==='leaderboard'){const result=await page.locator('.leaderboard-player').first().evaluate(e=>({rank:getComputedStyle(e.querySelector(':scope > span')).display,overflow:getComputedStyle(e.querySelector('.user-identity-name')).textOverflow}));if(width>768)assert.equal(result.rank,'none');else assert.equal(result.overflow,'ellipsis');}
  await page.screenshot({path:`.codex-run/six-${view}-${width}.png`});
 }
 await visit('.codex-run/beauty-b.html?view=settings');
 const rows=await page.locator('.volume-row').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),title=e.querySelector('button').getBoundingClientRect(),value=e.querySelector('strong').getBoundingClientRect();return {height:r.height,title:title.y+title.height/2,value:value.y+value.height/2}}));
 if(width<769)for(const r of rows){assert.ok(r.height<125);assert.ok(Math.abs(r.title-r.value)<2);}
 await page.screenshot({path:`.codex-run/six-settings-${width}.png`});
 await visit('.codex-run/beauty-b-extra.html?view=personalization');
 if(width>768){const h=await page.locator('.personalization-modal').evaluate(e=>e.getBoundingClientRect().height);assert.ok(h<450,'personalization height '+h);}
 await page.getByText('样式选择',{exact:true}).first().click();
 await page.getByRole('button',{name:'围棋部新星',exact:true}).click();
 assert.equal(await page.getByRole('img',{name:'试穿中'}).count(),1);
 await page.screenshot({path:`.codex-run/six-personalization-${width}.png`});
 await visit('.codex-run/beauty-b.html?view=auth'); await page.screenshot({path:'.codex-run/six-auth-debug.png'});
 await page.getByText('注册',{exact:true}).click();await page.locator('#auth-username').click();
 const colors=await page.locator('.segmented button').evaluateAll(es=>es.map(e=>getComputedStyle(e).backgroundColor));assert.notEqual(colors[0],colors[1]);
 await page.screenshot({path:`.codex-run/six-auth-${width}.png`});
 console.log('PASS',width);
}
await browser.close();




