import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const base = 'http://localhost:5173/docs/design-samples/information-paper-2026-10-22/';
const results = [];
const errors = [];
for (const [size, viewport] of [['desktop', { width: 1440, height: 960 }], ['mobile', { width: 390, height: 844 }], ['narrow', { width: 320, height: 568 }]]) {
 for (const window of ['announcement','mailbox']) {
  const page = await browser.newPage({ viewport });
  page.on('pageerror', e => errors.push(e.message));
  const network=[];
  page.on('request',request=>{if(new URL(request.url()).pathname.startsWith('/api/'))network.push(request.url());});
  for (const fixture of ['normal','long','empty']) {
   await page.goto(`${base}preview.html?window=${window}&fixture=${fixture}`);
   await page.locator('.information-center-modal').waitFor();
   await page.evaluate(()=>document.fonts.ready);
   if(fixture!=='empty') await page.locator(`.${window}-list-item`).first().waitFor();
   await page.waitForTimeout(700);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `${window} ${size} ${fixture}: page overflow`);
   if(fixture!=='empty') {
    const list=page.locator(`.${window}-list`);
    const geometry = await list.evaluate(list=>{
     const c=getComputedStyle(list), h=list.clientHeight-parseFloat(c.paddingTop)-parseFloat(c.paddingBottom), gap=parseFloat(c.rowGap), card=list.querySelector('li').getBoundingClientRect().height;
     return { x:list.scrollWidth-list.clientWidth, rows:(h+gap)/(card+gap) };
    });
    assert(geometry.x<=1, `${window} ${size} ${fixture}: list overflow ${geometry.x}`);
    assert(Math.abs(geometry.rows-Math.round(geometry.rows))<.03, `${window} ${size} ${fixture}: partial rows ${geometry.rows}`);
    await list.evaluate(e=>e.scrollTop=e.scrollHeight);
    await page.waitForTimeout(200);
    assert(await list.evaluate(e=>e.lastElementChild.getBoundingClientRect().bottom<=e.getBoundingClientRect().bottom-4), 'last card shadow gutter');
    await list.evaluate(e=>e.scrollTop=0);
    await page.locator(`.${window}-list-item`).first().click();
    await page.waitForTimeout(700);
    const bounds=await page.evaluate(window=>{
     const body=document.querySelector(window==='mailbox'?'.mailbox-body':'.announcement-detail-body');
     const reader=document.querySelector('.information-center-reader').getBoundingClientRect();
     const shelf=document.querySelector('.mailbox-attachment-shelf')?.getBoundingClientRect();
     return {body:body?.clientHeight,readerBottom:reader.bottom,shelfBottom:shelf?.bottom,overflow:body?body.scrollWidth-body.clientWidth:0};
    }, window);
    assert(bounds.body>=65, `${window} ${size} ${fixture}: body collapsed ${bounds.body}`);
    assert(bounds.overflow<=1, `${window} ${size} ${fixture}: body horizontal overflow`);
    if(bounds.shelfBottom) assert(bounds.shelfBottom<=bounds.readerBottom+1, `${window} ${size} ${fixture}: attachment clipped`);
    if(size==='narrow') await page.screenshot({path:`docs/design-samples/information-paper-2026-10-22/${window}-${size}-${fixture}.png`});
    if(fixture==='normal'&&window==='mailbox') {
     await page.getByRole('button',{name:/查看道具详情/}).click();
     await page.getByRole('dialog',{name:'招募海报'}).waitFor();
     await page.getByRole('button',{name:'关闭道具详情'}).click();
     await page.getByRole('button',{name:'领取附件',exact:true}).click();
     await page.getByRole('button',{name:'已领取',exact:true}).waitFor();
     assert(await page.getByRole('button',{name:'已领取',exact:true}).isDisabled());
     await page.getByRole('button',{name:'删除邮件',exact:true}).click();
     await page.waitForTimeout(500);
     assert.equal(await page.locator('.mailbox-list-item').count(),5);
    }
    if(fixture==='normal'&&window==='announcement') {
     await page.getByRole('tab',{name:/日志/}).click();
     await page.waitForTimeout(500);
     assert.equal(await page.locator('.announcement-list-item').count(),2);
    }
    if(size!=='desktop'&&fixture==='long') {
     await page.getByRole('button',{name:window==='mailbox'?'返回邮件列表':'返回公告列表'}).click();
     await page.waitForTimeout(350);
     assert.equal(await page.locator('.information-center-modal').getAttribute('data-mobile-view'),'list');
    }
   }
   assert.equal(network.length,0,'fixture leaked a real API request');
   results.push(`${window}/${size}/${fixture}: PASS`);
   console.log(results.at(-1));
  }
  await page.close();
 }
}
const page=await browser.newPage({viewport:{width:1440,height:960}});
await page.goto(`${base}preview.html?window=mailbox`);
await page.locator('.mailbox-list-item').first().waitFor();
await page.waitForTimeout(700);
const card=page.locator('.mailbox-list-item').nth(1);
const defaultTransform=await card.evaluate(e=>getComputedStyle(e).transform);
await card.hover(); await page.waitForTimeout(180);
assert.notEqual(await card.evaluate(e=>getComputedStyle(e).transform),defaultTransform);
await page.mouse.down(); await page.waitForTimeout(180);
assert.match(await card.evaluate(e=>getComputedStyle(e).transform),/2, 3\)$/);
await page.mouse.up();
const animations=await page.locator('.mailbox-detail-header,.mailbox-body,.mailbox-attachment-shelf').evaluateAll(es=>es.map(e=>{const c=getComputedStyle(e);return [c.animationName,c.animationDuration,c.animationDelay];}));
assert(animations.every(a=>a[0]==='mailbox-detail-content-enter'&&a[1]==='0.42s'));
assert.deepEqual(animations.map(a=>a[2]),['0s','0.1s','0.2s']);
await page.emulateMedia({reducedMotion:'reduce'});
assert.equal(await card.evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
await page.goto(`${base}index.html`);
await page.locator('iframe').waitFor();
await page.locator('[data-window="mailbox"]').click();
await page.locator('[data-size="mobile"]').click();
await page.frameLocator('iframe').locator('.mailbox-list-item').first().waitFor();
await page.screenshot({path:'docs/design-samples/information-paper-2026-10-22/studio.png',fullPage:true});
assert.equal(await page.evaluate(()=>document.fonts.check('16px "Sigrika Window Title"')),true);
results.push('hover/press, original mailbox motion, reduced motion, studio controls: PASS');
assert.deepEqual(errors,[]);
writeFileSync('docs/design-samples/information-paper-2026-10-22/verification.json',JSON.stringify({results,animations,errors},null,2)+'\n');
await browser.close();
console.log('ALL PASS',results.length);
