import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {fileURLToPath} from 'node:url';
const b=await chromium.launch({channel:'chrome',headless:true});let count=0;const errors=[];
try{for(const [width,height] of [[320,568],[360,800],[390,844],[430,915],[1440,1000]]){
 const p=await b.newPage({viewport:{width,height},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));let normalHeight;
 for(const state of ['','long','many','empty']){
  await p.goto(`http://localhost:5173/docs/design-samples/watch-2026-10-12/preview.html?view=ledger&${state}`);await p.locator('.watch-ledger').waitFor();await p.evaluate(()=>document.fonts.ready);await p.locator('img').evaluateAll(ns=>Promise.all(ns.map(n=>n.decode())));await p.waitForTimeout(300);
  const result=await p.evaluate(()=>{const shell=document.querySelector('.watch-ledger'),scroll=shell.querySelector('.wl-scroll'),rows=[...shell.querySelectorAll('.wl-row')];return{height:shell.offsetHeight,overflow:Math.max(document.documentElement.scrollWidth-innerWidth,scroll.scrollWidth-scroll.clientWidth),rows:rows.map(r=>{const rect=n=>n.getBoundingClientRect();const rr=rect(r),hit=rect(r.querySelector('button')),code=rect(r.querySelector('.wl-code')),people=rect(r.querySelector('.wl-people'));return{hit:Math.abs(rr.width-hit.width)<2&&Math.abs(rr.height-hit.height)<2,adjacent:innerWidth>768?(r.querySelector(".wl-mode").nextElementSibling.classList.contains("wl-people")):(people.left-code.right<=8&&people.left>=code.right&&Math.abs(people.top+people.bottom-code.top-code.bottom)<3),color:getComputedStyle(r.querySelector('.wl-status > span')).color,finished:r.classList.contains('finished'),clipped:innerWidth<=768&&[...r.querySelectorAll('.user-identity-name')].some(n=>{const range=document.createRange();range.selectNodeContents(n);const owner=rect(n.closest('.wl-player'));return[...range.getClientRects()].some(x=>x.right>owner.right+1||x.left<owner.left-1)}),placardClipped:r.querySelector('.room-move-placard').scrollWidth>r.querySelector('.room-move-placard').clientWidth+1}})};});
  assert.ok(result.overflow<=1,`${width}/${state}: overflow`);if(!state)normalHeight=result.height;assert.equal(result.height,normalHeight);
  for(const r of result.rows){assert.ok(r.hit&&r.adjacent&&!r.clipped&&!r.placardClipped,`${width}/${state}: ${JSON.stringify(r)}`);assert.equal(r.color,r.finished?'rgb(102, 102, 102)':'rgb(44, 111, 70)');}
  assert.equal(await p.getByText('观战',{exact:true}).count(),0);
  if(!state){if([390,1440].includes(width))await p.screenshot({path:fileURLToPath(new URL(`production-${width===390?'mobile':'desktop'}.png`,import.meta.url))});const search=p.getByRole('textbox',{name:'搜索房间或玩家'});await search.fill('483126');assert.equal(await p.locator('.wl-row').count(),1);await search.fill('');}
  if(state!=='empty'){await p.locator('.wl-row button').last().scrollIntoViewIfNeeded();await p.locator('.wl-row button').last().click();await p.getByRole('button',{name:'打开观战窗口'}).click();for(const key of ['Enter','Space']){await p.locator('.wl-row button').first().focus();await p.keyboard.press(key);await p.getByRole('button',{name:'打开观战窗口'}).click();}}
  count++;
 }
 await p.close();
}assert.deepEqual(errors,[]);console.log(`${count} production viewport/state checks passed`);}finally{await b.close();}
