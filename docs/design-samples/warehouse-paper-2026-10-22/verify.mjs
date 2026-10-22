import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { ESLint } from 'eslint';
import eslintConfig from '../../../eslint.config.js';
import { settleWindow } from '../../../tests/e2e/window-surfaces-fixture.js';
const base=process.env.SAMPLE_ORIGIN||'http://127.0.0.1:5173';
const route='/docs/design-samples/warehouse-paper-2026-10-22/';
const out=fileURLToPath(new URL('.',import.meta.url));
const config={...eslintConfig[1],files:['**/*.{js,jsx,mjs}']};
const lint=new ESLint({overrideConfigFile:true,overrideConfig:[config]});
const lintResults=await lint.lintFiles([`${out}sample.jsx`,`${out}gallery.js`,`${out}verify.mjs`]);
const errorsAndWarnings=lintResults.flatMap(result=>result.messages.map(message=>`${result.filePath}:${message.line} ${message.message}`));
assert.deepEqual(errorsAndWarnings,[],'Scoped ESLint');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage();
const errors=[],api=[],results=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('request',req=>{if(new URL(req.url()).pathname.startsWith('/api/'))api.push(req.url());});
async function open(width,height,query=''){
  await page.setViewportSize({width,height});await page.goto(`${base}${route}preview.html${query}`);await page.locator('.warehouse-template').waitFor();await settleWindow(page);
}
async function wholeCards(target=page){
  await target.waitForFunction(()=>{
    const list=document.querySelector('.wt-list');
    if(!list)return false;
    const bounds=list.getBoundingClientRect();
    const cards=[...list.querySelectorAll('.wt-card')].map(card=>card.getBoundingClientRect()).filter(card=>card.bottom>bounds.top+1&&card.top<bounds.bottom-1);
    return cards.length>0&&cards.every(card=>card.top>=bounds.top+1&&card.bottom+4<=bounds.bottom+1);
  },{},{timeout:4000});
}
async function scrollDirectory(){
  const list=page.locator('.wt-list');
  await wholeCards();
  const before=await list.evaluate(el=>el.scrollTop);
  await list.hover();await page.mouse.wheel(0,137);await page.mouse.move(0,0);
  await page.waitForFunction(previous=>document.querySelector('.wt-list').scrollTop>previous,before);
  await wholeCards();
  await list.evaluate(el=>{el.scrollTop=el.scrollHeight;});await wholeCards();
  const last=await page.locator('.wt-card').last().boundingBox();
  const bounds=await list.boundingBox();
  assert(last.y>=bounds.y&&last.y+last.height+4<=bounds.y+bounds.height+1,'Last card is fully reachable');
  await list.evaluate(el=>{el.scrollTop=0;});await wholeCards();
}
async function validate(width,height,query='',name=`${width}x${height}`){
  await open(width,height,query);
  await page.screenshot({path:`${out}template-${name}.png`});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Page must not overflow horizontally');
  assert.equal(await page.locator('.warehouse-template img').evaluateAll(els=>els.filter(el=>!el.complete||el.naturalWidth===0).length),0,'Artwork must load');
  const shell=await page.locator('.warehouse-template').boundingBox();
  const detail=await page.locator('.wt-detail').boundingBox();
  if(width<=768)assert(detail.height<=227,'Phone detail stays compact instead of filling most of the window');
  if(!query)assert(await page.locator('.wt-copy').evaluate(el=>el.scrollHeight<=el.clientHeight+1),'Normal item description fits the compact detail');
  assert(detail.x+detail.width+4<=shell.x+shell.width,'Detail shadow must stay in window');
  assert(detail.y+detail.height+4<=shell.y+shell.height,'Detail bottom must stay in window');
  const action=await page.locator('.wt-action-row').boundingBox();
  assert(action.y+action.height<=detail.y+detail.height-2,'Quantity and action stay completely visible');
  assert.equal(await page.locator('.wt-pagination,.wt-filters,.wt-type').count(),0,'No paging or categories');
  assert.equal(await page.locator('.wt-orbit').count(),1,'Original circular artwork backdrop is retained');
  assert.notEqual(await page.locator('.wt-hero > :is(img,svg)').evaluate(el=>getComputedStyle(el).transform),'none','Artwork retains its rotation');
  const count=page.locator('.wt-card').count();
  if(await count){
    await scrollDirectory();
    if(width<=768){
      const rows=await page.locator('.wt-card').evaluateAll(cards=>cards.map(el=>{const rect=el.getBoundingClientRect();return {left:rect.left,top:rect.top,bottom:rect.bottom};}));
      assert(rows.every((row,index)=>index===0||(row.left===rows[0].left&&row.top>=rows[index-1].bottom)),'Mobile has one item per row');
    }
    const last=page.locator('.wt-card').last();await last.scrollIntoViewIfNeeded();
    const [list,lastBox]=await Promise.all([page.locator('.wt-list').boundingBox(),last.boundingBox()]);
    assert(lastBox.x+lastBox.width+4<=list.x+list.width,'Last card shadow clears right edge');
    assert(lastBox.y+lastBox.height+4<=list.y+list.height,`Last card shadow clears bottom edge: ${JSON.stringify({list,lastBox})}`);
    await page.locator('.wt-list').evaluate(el=>{el.scrollTop=0;});await wholeCards();
    for(const control of ['.wt-card-name','.wt-card .wt-quantity']) assert.equal(await page.locator(control).evaluateAll(els=>els.filter(el=>el.scrollWidth>el.clientWidth+1).length),0,`${control} fits`);
    const outside=await page.locator('.wt-card').evaluateAll(cards=>cards.flatMap(card=>{const box=card.getBoundingClientRect();return [...card.querySelectorAll('.wt-card-name,.wt-quantity')].filter(el=>{const b=el.getBoundingClientRect();return b.bottom>box.bottom-2||b.right>box.right-2||b.left<box.left+2;}).map(el=>el.textContent);}));
    assert.deepEqual(outside,[],'Names and quantities must stay inside their cards');
  }
  await page.screenshot({path:`${out}template-${name}.png`});results.push({width,height,query,layout:'pass'});
}
try{
  for(const [w,h] of [[1440,900],[390,844],[360,800],[320,740],[390,600]])await validate(w,h);
  if(process.argv.includes('--quick')){console.log('Five viewport previews saved.');process.exitCode=0;}
  else{
    await validate(320,740,'?large','large-320');await validate(320,740,'?long','long-320');await validate(390,844,'?empty','empty-390');
    await open(1440,900);
    const first=page.locator('.wt-card').first();await first.hover();await page.waitForTimeout(180);assert.equal(await first.evaluate(el=>getComputedStyle(el).translate),'-1px -2px');
    await page.mouse.down();await page.waitForTimeout(180);assert.equal(await first.evaluate(el=>getComputedStyle(el).translate),'2px 3px');await page.mouse.up();
    await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await first.evaluate(el=>getComputedStyle(el).transitionProperty),'none');
    await page.getByRole('button',{name:'使用',exact:true}).click();await page.getByRole('button',{name:'取消',exact:true}).click();assert.equal(await page.locator('.wt-detail .wt-quantity strong').textContent(),'12');
    await page.getByRole('button',{name:'使用',exact:true}).click();await page.getByRole('button',{name:'确认使用',exact:true}).click();assert.equal(await page.locator('.wt-detail .wt-quantity strong').textContent(),'11');
    await page.getByRole('button',{name:'选择招募海报，持有 128',exact:true}).click();assert.equal(await page.locator('.wt-copy h3').textContent(),'招募海报');
    await page.getByRole('button',{name:'前去招募',exact:true}).click();assert.equal(await page.locator('.wt-detail .wt-quantity strong').textContent(),'128');
    assert.equal(await page.locator('.wt-card').count(),6);
    await page.getByRole('button',{name:'关闭仓库',exact:true}).click();await page.getByRole('button',{name:'打开仓库模板',exact:true}).click();
    await wholeCards();
    await page.setViewportSize({width:390,height:844});await wholeCards();
    await page.locator('.wt-list').evaluate(el=>{el.scrollTop=170;});await wholeCards();
    await page.setViewportSize({width:320,height:740});await wholeCards();
    await page.setViewportSize({width:390,height:600});await wholeCards();
    const phone=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    const touch=await phone.newPage();await touch.goto(`${base}${route}preview.html`);await settleWindow(touch);
    const client=await phone.newCDPSession(touch);
    const area=await touch.locator('.wt-list').boundingBox();
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:area.x+area.width/2,y:area.y+area.height-30}]});
    for(let step=1;step<=8;step++){
      await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:area.x+area.width/2,y:area.y+area.height-30-step*19}]});
      await touch.waitForTimeout(20);
    }
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await touch.waitForFunction(()=>document.querySelector('.wt-list').scrollTop>0);await wholeCards(touch);
    await touch.screenshot({path:`${out}template-mobile-scrolled.png`});await phone.close();
    await open(390,844,'?empty');assert(await page.getByRole('button',{name:'使用',exact:true}).isDisabled());
    await page.goto(`${base}${route}`);await page.locator('#phone').click();assert(await page.locator('#preview').evaluate(el=>el.classList.contains('phone')));
    await page.getByRole('button',{name:'正式效果',exact:true}).click();assert((await page.locator('#preview').getAttribute('src')).includes('production.html'));
    await page.getByRole('button',{name:'设计模板',exact:true}).click();await page.getByRole('button',{name:'重置',exact:true}).click();
    assert.deepEqual(errors,[]);assert.deepEqual(api,[]);
    await writeFile(`${out}verification.json`,JSON.stringify({results,interactions:'pass',wholeCardScrolling:'wheel, touch, endpoints, resize and reopen passed',errors,apiRequests:api},null,2)+'\n');console.log(`${results.length} viewport/state checks and interactions passed; whole-card wheel/touch scrolling passed; zero API requests.`);
  }
}finally{await browser.close();}
