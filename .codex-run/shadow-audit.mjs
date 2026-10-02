import{preview}from'vite';const server=await preview({build:{outDir:'.codex-run/six-dist'},preview:{host:'127.0.0.1',port:5180,strictPort:true}});
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {RECRUITMENT_ITEMS} from '../src/shared/recruitment.js';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage();
const players=Array.from({length:4},(_,i)=>({id:String(i),username:i===2?'WWWWWWWW':'星焰一号',commonCharacter:'sigrika',characterId:'sigrika',rank:'3段',rating:1800-i*37,totalGames:50,wins:30,losses:20,status:'online'}));
const items=Object.values(RECRUITMENT_ITEMS).map((v,i)=>({...v,id:String(i),itemId:v.itemType,quantity:3,category:'item',finalPrice:120,purchasable:true}));
await page.route('http://127.0.0.1:5180/api/**',r=>{const u=r.request().url();let data={items};if(u.includes('leaderboard'))data={players};if(u.includes('/social'))data={friends:players,blacklist:[]};if(u.endsWith('/achievements'))data={achievements:Array.from({length:16},(_,i)=>({id:String(i),name:'练习成就'+i,content:'完成围棋练习',reward:{},achieved:false}))};if(u.includes('achievement-equipment'))data={assets:[{id:'x',type:'title',name:'围棋部新星'}],equipment:{},equipmentAssets:{}};return r.fulfill({json:data});});
async function visit(url){await page.goto('http://127.0.0.1:5180/'+url,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);}

for(const width of [1440,390,320]){
 await page.setViewportSize({width,height:width===1440?900:width===320?568:844});
 for(const [file,views] of [['audit-a',['shop','friends','leaderboard','house','warehouse','watch','recruitment']],['beauty-b',['settings','theme','about','mailbox','announcement','message']],['beauty-b-extra',['personalization','achievement']]])for(const view of views){
 await visit(`.codex-run/${file}.html?view=${['theme','about'].includes(view)?'settings':view}`);if(['theme','about'].includes(view))await page.getByRole('tab',{name:view==='theme'?'界面':'关于'}).click();
 for(const edge of ['top','bottom']){if(edge==='bottom')await page.evaluate(()=>{for(const e of document.querySelectorAll('.modal-backdrop *'))if(getComputedStyle(e).overflowY==='auto')e.scrollTop=e.scrollHeight;});
 const issues=await page.evaluate(()=>{const out=[];for(const e of document.querySelectorAll('.modal-backdrop *')){const s=getComputedStyle(e),r=e.getBoundingClientRect();if(!r.width||!r.height||s.boxShadow==='none'||s.boxShadow.includes('inset'))continue;const vals=s.boxShadow.replace(/rgba?\([^)]+\)/g,'').match(/-?[\d.]+px/g)?.map(parseFloat);if(!vals||vals[2]>3)continue;const dx=Math.max(0,vals[0]+(vals[3]||0)),dy=Math.max(0,vals[1]+(vals[3]||0));for(let a=e.parentElement;a&&!a.classList.contains('modal-backdrop');a=a.parentElement){const c=getComputedStyle(a),b=a.getBoundingClientRect();const right=b.left+a.clientLeft+a.clientWidth,bottom=b.top+a.clientTop+a.clientHeight;if(r.left<b.left-1||r.top<b.top-1||r.right>right+1||r.bottom>bottom+1)continue;const x=c.overflowX!=='visible'&&r.right+dx>right+0.5,y=c.overflowY!=='visible'&&r.bottom+dy>bottom+0.5;if(x||y){out.push({element:e.className,owner:a.className,axis:(x?'x':'')+(y?'y':''),padding:c.padding,shadow:s.boxShadow});break;}}}return out;});
 console.log(JSON.stringify({width,view,edge,issues}));if(edge==='top'&&['settings','shop'].includes(view))await page.screenshot({path:`.codex-run/shadow-${view}-${width}.png`});
 }
 }
}
await browser.close();server.httpServer.close();process.exit();
