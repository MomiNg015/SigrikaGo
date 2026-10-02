import {chromium} from '@playwright/test';
const b=await chromium.launch({headless:true,channel:'msedge'});const p=await b.newPage();
const phase=process.argv[2]||'before';
for(const [width,height] of [[360,800],[390,844],[412,915],[360,640],[1440,900]]){
 await p.setViewportSize({width,height});
 await p.goto('http://127.0.0.1:5173/.codex-run/profile-records-preview.html');
 await p.locator('.profile-character-table').waitFor();
 for(const sticker of [false,true]){
  await p.evaluate(s=>window.renderProfile(s),sticker);await p.waitForTimeout(200);
  await p.locator('.profile-resume-view-social').evaluate(e=>{e.scrollTop=0;});
  console.log(width,height,sticker,await p.evaluate(()=>['.user-profile-modal','.profile-resume-view','.profile-resume-hero','.profile-record-panel','.profile-overview-grid','.profile-character-section','.profile-character-table-scroll'].map(s=>{const e=document.querySelector(s),c=getComputedStyle(e),r=e.getBoundingClientRect();return {s,y:r.y,h:r.height,scroll:e.scrollHeight,overflow:c.overflow,rows:c.gridTemplateRows};})));
  await p.screenshot({path:`.codex-run/profile-${phase}-${width}-${height}-${sticker}.png`});
  if(phase==='fixed' && width<=768){
   const result=await p.evaluate(()=>{const body=document.querySelector('.profile-resume-view-social');body.scrollTop=body.scrollHeight;const last=document.querySelector('.profile-character-table tbody tr:last-child').getBoundingClientRect();const rect=body.getBoundingClientRect();return {lastVisible:last.top>=rect.top-1&&last.bottom<=rect.bottom+1,overflow:document.documentElement.scrollWidth>innerWidth,bodyHeight:rect.height,listHeight:document.querySelector('.profile-character-table-scroll').getBoundingClientRect().height};});
   console.log('SCROLL_CHECK',width,height,sticker,result);
   if(!result.lastVisible||result.overflow||result.listHeight<60)throw new Error('Character records unreachable');
   await p.screenshot({path:`.codex-run/profile-${phase}-${width}-${height}-${sticker}-scrolled.png`});
  }
 }
}
await b.close();
