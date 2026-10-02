import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage();
const players=Array.from({length:8},(_,i)=>({id:String(i),username:i===2?'比较长的部员名字测试':'星焰部员'+(i+1),commonCharacter:'sigrika',characterId:'sigrika',rank:'3段',rating:1800-i*37,totalGames:50,wins:30,losses:20,status:['online','offline','playing'][i%3]}));
await page.route('http://localhost:5175/api/**',route=>{const u=route.request().url();let data={};if(u.includes('leaderboard'))data={players};if(u.includes('/social'))data={friends:players,blacklist:[]};if(u.includes('rooms/watch'))data={rooms:players.slice(0,5).map((p,i)=>({code:100000+i,onlineCount:2+i,moveNumber:23+i*11,status:i===3?'finished':'playing',black:{character:'sigrika',connected:true,user:p},white:{character:'sigrika',connected:true,user:players[i+1]}})),roomCounts:{spark:5}};if(u.includes('inventory'))data={items:[]};if(u.includes('/shop'))data={items:[]};if(u.includes('/recruitment'))data={items:[],utilities:[],task:null};return route.fulfill({json:data});});
page.on('pageerror',e=>console.log('PAGEERROR',e.message));
for (const width of [1440,390]) {await page.setViewportSize({width,height:width===390?844:1000});for(const view of ['leaderboard','friends']){await page.goto('http://localhost:5175/.codex-run/audit-a.html?view='+view,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(3000);await page.screenshot({path:`.codex-run/audit-a-${view}-${width}.png`});console.log(view,width,(await page.locator('body').innerText()).slice(-500));}}
await browser.close();


