import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory=path.dirname(fileURLToPath(import.meta.url));
const origin=process.env.SAMPLE_ORIGIN || 'http://127.0.0.1:5173';
const base=`${origin}/docs/design-samples/profile-balanced-v3-2026-10-19/`;
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage();
const errors=[];
const checks=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('console',message=>{if(message.type()==='error') errors.push(message.text());});
page.on('response',response=>{if(response.status()>=400) errors.push(`${response.status()} ${response.url()}`);});
page.on('request',request=>{
  const pathname=new URL(request.url()).pathname;
  if(pathname.startsWith('/api/')) errors.push(`Unexpected account request: ${request.url()}`);
  if(pathname.includes('/assets/characters/handbook-sprites/')) errors.push(`Retired artwork requested: ${request.url()}`);
});
const assert=(condition,message)=>{if(!condition) throw new Error(message);};
const ready=()=>page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode()));});
const noOverflow=async(label)=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${label}: horizontal page overflow`);
try {
  for(const design of ['mint','ink','blue']) {
    for(const viewport of [{width:1440,height:900},{width:768,height:1024},{width:390,height:844},{width:320,height:568}]) {
      await page.setViewportSize(viewport);
      await page.goto(`${base}${design}.html`);await ready();
      await noOverflow(`${design}/${viewport.width}`);
      const geometry=await page.evaluate(()=>{
        const rail=document.querySelector('.window-bookmark-rail').getBoundingClientRect();
        const canvas=document.querySelector('.canvas-inner').getBoundingClientRect();
        const tabs=[...document.querySelectorAll('[role=tab]')];
        return {left:rail.left,right:rail.right,canvas:canvas.left,labels:tabs.map(t=>t.textContent),vertical:tabs[1].getBoundingClientRect().top>tabs[0].getBoundingClientRect().bottom,writing:getComputedStyle(document.querySelector('.window-bookmark-label')).writingMode,cards:document.querySelectorAll('.operator-card').length};
      });
      assert(geometry.left>=0 && geometry.right<=geometry.canvas && geometry.vertical,`Bookmarks must stay on left: ${JSON.stringify(geometry)}`);
      assert(geometry.labels.join('/')==='星炬/标准/其它' && geometry.cards===4,'Expected retained tabs and four records');
      const content=await page.locator('.profile-window').innerText();
      assert(!/光荣之路|入社日|苏醒日|入职日|UID|#5216|签名|章节|成就陈列/.test(content),'Only existing project fields belong in the profile');
      assert(await page.locator('.operator-outcomes b').count()===12,'All four character win/loss/draw records are visible');
      const portraitSources=await page.locator('.face-crop img').evaluateAll(images=>images.map(image=>image.getAttribute('src')));
      assert(portraitSources.every(src=>src.includes('/handbook-chibi-sprites/') && src.endsWith('-avatar.webp')),'Identity and record cards must use current complete-head avatars');
      if(design!=='ink') assert(await page.locator('.hero-art').getAttribute('src')==='/assets/characters/handbook-chibi-sprites/sigrika.webp','Hero must use the current full-body source');
      assert(geometry.writing===(viewport.width<=768 ? 'vertical-rl' : 'horizontal-tb'),'Bookmark writing orientation');
      if(viewport.width===1440 || viewport.width===390) await page.screenshot({path:path.join(directory,`${design}-${viewport.width===1440 ? 'desktop' : 'mobile'}.png`),fullPage:true});
      await page.locator('[data-mode=spark]').focus();await page.keyboard.press('ArrowDown');
      assert(await page.locator('[data-mode=standard]').getAttribute('aria-selected')==='true','ArrowDown activates standard');
      assert(await page.locator('.operator-card').count()===0,'Standard must not expose skill-character records');
      await page.keyboard.press('End');assert(await page.locator('[data-mode=other]').getAttribute('aria-selected')==='true','End activates other');
      await page.keyboard.press('Home');assert(await page.locator('[data-mode=spark]').getAttribute('aria-selected')==='true','Home restores spark');
      await page.locator('[data-play=capture]').click();assert(await page.locator('.capture-metrics').count()===1 && await page.locator('.rank-panel').count()===0,'Capture-specific summary without regular rank');
      await page.locator('[data-play=team]').click();assert((await page.locator('.operator-count').first().innerText()).replace(/\s/g,'')==='出场26','Team appearances use separate data');
      await page.locator('[data-play=regular]').click();
      await page.locator('[data-character=denia]').click();assert(await page.locator('dialog').evaluate(d=>d.open),'Character detail opens');
      await page.keyboard.press('Escape');assert(await page.locator('[data-character=denia]').evaluate(node=>document.activeElement===node),'Dialog restores trigger focus');
      await page.locator('[data-action=replays]').first().click();assert(await page.locator('.replay-list li').count()===5,'Replay preview list');await page.keyboard.press('Escape');
      await page.locator('[data-action=personalize]').click();await page.locator('[data-select-character=aemeath]').click();
      assert(await page.locator('.avatar-frame img').getAttribute('src')==='/assets/characters/handbook-chibi-sprites/aemeath-avatar.webp','Selected current avatar is used');
      await page.locator('[data-context=social]').click();await page.locator('[data-action=like]').click();assert(await page.locator('[data-action=like]').isDisabled(),'Like only once');
      await page.locator('[data-action=friend]').click();assert(await page.locator('[data-action=friend]').isDisabled(),'Friend pending');
      await page.locator('[data-action=block]').click();await page.locator('[data-action=confirm-block]').click();
      assert((await page.locator('[data-action=block]').innerText()).includes('移出'),'Local block state');
      await page.locator('[data-action=report]').click();await page.locator('[name=reason]').selectOption({label:'恶意骚扰'});await page.locator('[name=detail]').fill('本地样板测试');await page.locator('button[type=submit]').click();
      assert(!(await page.locator('dialog').evaluate(d=>d.open)),'Report demonstration closes without network');
      await page.locator('#fixture').selectOption('empty');assert(await page.locator('.operator-card').count()===0,'Empty record state');await noOverflow('empty');
      await page.locator('#fixture').selectOption('long');await ready();await noOverflow('long name');
      const identity=await page.evaluate(()=>{
        const name=document.querySelector('.identity h2').getBoundingClientRect();
        const actions=document.querySelector('.identity-actions').getBoundingClientRect();
        const container=document.querySelector('.identity').getBoundingClientRect();
        return {nameBottom:name.bottom,actionsTop:actions.top,nameRight:name.right,containerRight:container.right};
      });
      assert(identity.nameBottom<=identity.actionsTop && identity.nameRight<=identity.containerRight,'Long name must not overlap identity actions');
      if(viewport.width===320) await page.screenshot({path:path.join(directory,`${design}-long-320.png`),fullPage:true,style:'.toast { visibility: hidden; }'});
      await page.locator('.operator-card').last().scrollIntoViewIfNeeded();assert(await page.locator('.operator-card').last().isVisible(),'Last content remains reachable');
      await page.locator('[data-action=close]').click();assert(await page.locator('[data-action=reopen]').count()===1,'Close/reopen');await page.locator('[data-action=reopen]').click();
      await page.emulateMedia({reducedMotion:'reduce'});assert(await page.locator('.window-bookmark-tab').first().evaluate(node=>getComputedStyle(node).transitionDuration==='0s'),'Reduced-motion bookmark transition');await page.emulateMedia({reducedMotion:'no-preference'});
      checks.push({design,viewport:`${viewport.width}x${viewport.height}`,result:'passed',bookmarks:geometry});
    }
  }
  await page.setViewportSize({width:1440,height:1000});await page.goto(`${base}index.html`);
  await page.locator('[data-design=ink]').click();
  await page.locator('button[data-viewport=mobile]').click();
  assert(await page.locator('iframe').evaluate(frame=>frame.getBoundingClientRect().width===390),'Real 390px iframe');
  assert((await page.locator('iframe').getAttribute('src')).includes('ink'),'Design switch');
  await page.locator('button[data-viewport=desktop]').click();await page.screenshot({path:path.join(directory,'comparison.png'),fullPage:true});
  assert(errors.length===0,errors.join('\n'));
  await fs.writeFile(path.join(directory,'verification.json'),JSON.stringify({date:'2026-10-19',checks,errors,comparison:'passed'},null,2)+'\n');
  console.log(`PASS ${checks.length} direction/viewport combinations, existing fields, complete stats, left bookmarks, interactions, comparison. No console/resource/API errors.`);
} finally {await browser.close();}
