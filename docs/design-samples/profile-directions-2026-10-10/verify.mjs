import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const directory = path.dirname(fileURLToPath(import.meta.url));
const base = 'http://127.0.0.1:5196/docs/design-samples/profile-directions-2026-10-10/';
const browser = await chromium.launch({channel:'chrome',headless:true});
const errors = [];
const checks = [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
try {
  for (const width of [1440,390,360]) {
    for (const design of ['folder','scoresheet','collection']) {
      for (const context of ['self','social']) {
        const page = await browser.newPage({viewport:{width,height:width===360?640:width===390?844:1000}});
        page.on('pageerror',(e)=>errors.push(e.message));
        page.on('console',(m)=>{if(m.type()==='error')errors.push(m.text());});
        await page.goto(`${base}${design}.html?context=${context}`);
        await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
        const geometry = await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,images:[...document.images].every(i=>i.naturalWidth>0),font:document.fonts.check('24px "Sigrika Window Title"')}));
        assert(!geometry.overflow&&geometry.images&&geometry.font,`${design}/${width}/${context}: ${JSON.stringify(geometry)}`);
        await page.screenshot({path:path.join(directory,`${design}-${context}-${width}.png`),fullPage:true,animations:'disabled'});
        if(design==='collection') {
          await page.locator('[data-leaf="characters"]').click();
          assert(await page.locator('.character-card').count()===6,'Missing collection records');
          await page.locator('.character-card').last().scrollIntoViewIfNeeded();
          if(width===1440&&context==='self')await page.screenshot({path:path.join(directory,'collection-records-1440.png'),fullPage:true,animations:'disabled'});
        } else await page.locator('tbody tr').last().scrollIntoViewIfNeeded();
        assert(await page.locator('[data-mode="capture"]').isVisible(),'Missing capture category');
        assert(await page.locator('[data-mode="team"]').isVisible(),'Missing team category');
        await page.locator('[data-group="standard"]').click();
        assert(await page.locator(design==='collection'?'.character-card':'tbody tr').count()===3,'Mode data mismatch');
        await page.locator('[data-group="other"]').click();
        assert(await page.locator('.empty').isVisible(),'Missing empty state');
        await page.locator('[data-group="spark"]').click();
        await page.locator('[data-mode="capture"]').click();
        assert(await page.locator('.challenge-score').isVisible(),'Missing challenge record');
        assert(await page.locator('.rank,.metrics,.records,.recent').count()===0,'Challenge incorrectly uses ranked stats');
        await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));});
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Challenge overflow');
        await page.screenshot({path:path.join(directory,`${design}-${context}-capture-${width}.png`),fullPage:true,animations:'disabled'});
        await page.locator('[data-action="challenge-ranking"]').click();
        assert(await page.locator('#detail').isVisible(),'Challenge leaderboard did not open');
        await page.keyboard.press('Escape');
        await page.locator('#data-state').selectOption('empty');
        assert((await page.locator('.empty').textContent()).includes('吃子挑战'),'Wrong challenge empty state');
        await page.locator('#data-state').selectOption('normal');
        await page.locator('[data-mode="team"]').click();
        assert(await page.locator('.team-record').count()===3,'Missing team replays');
        assert(await page.locator('.rank,.metrics,.records,.recent').count()===0,'Team incorrectly uses ranked stats');
        await page.locator('.team-record').last().scrollIntoViewIfNeeded();
        await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));});
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Team view overflow');
        await page.screenshot({path:path.join(directory,`${design}-${context}-team-${width}.png`),fullPage:true,animations:'disabled'});
        await page.locator('[data-action="team-replay"]').first().click();
        await page.keyboard.press('Escape');
        await page.locator('#data-state').selectOption('empty');
        assert((await page.locator('.empty').textContent()).includes('队际赛'),'Wrong team empty state');
        await page.locator('#data-state').selectOption('normal');
        await page.locator('[data-mode="spark"]').click();
        if(design==='collection')await page.locator('[data-leaf="overview"]').click();
        await page.locator('[data-action="replays"]').click();
        assert(await page.locator('.replay-list>div').count()===10,'Missing replay fixtures');
        await page.keyboard.press('Escape');
        if(context==='social') {
          await page.locator('[data-action="like"]').click();
          assert(await page.locator('[data-action="like"]').isDisabled(),'Like guard missing');
          await page.locator('[data-action="friend"]').click();
          await page.locator('[data-action="confirm-friend"]').click();
          assert(await page.locator('[data-action="friend"]').isDisabled(),'Friend guard missing');
          await page.locator('[data-action="more"]').click();
          await page.locator('[data-action="report"]').click();
          assert(await page.locator('[data-action="confirm-report"]').isDisabled(),'Empty report is allowed');
          await page.locator('#report-content').fill('样板测试');
          await page.locator('[data-action="confirm-report"]').click();
        } else {
          await page.locator('[data-action="personalize"]').click();
          await page.locator('#sample-name').fill('星炬围棋社同学');
          await page.locator('[data-action="save-name"]').click();
          assert((await page.locator('.identity h2').textContent()).includes('星炬围棋社'),'Name preview failed');
        }
        await page.locator('#data-state').selectOption('long');
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Long name overflow');
        await page.locator('#data-state').selectOption('error');
        assert(await page.locator('[role="alert"]').isVisible(),'Error feedback missing');
        await page.locator('[data-action="retry"]').click();
        assert(await page.locator('[data-mode="standard"]').getAttribute('aria-pressed')==='true','Retry did not commit new mode');
        await page.locator('#data-state').selectOption('loading');
        assert((await page.locator('.feedback').textContent()).includes('仍显示星炬'),'Loading context lost');
        await page.locator('[data-action="retry"]').click();
        await page.locator('#data-state').selectOption('nine');
        assert((await page.locator('.rank').textContent()).includes('1,200'),'Nine dan missing points');
        await page.locator('[data-action="close"]').click();
        assert(await page.locator('#profile').isHidden(),'Close failed');
        await page.locator('#reopen').click();
        await page.locator('[data-group="spark"]').focus();
        await page.keyboard.press('ArrowRight');
        assert(await page.locator('[data-mode="standard"]').getAttribute('aria-pressed')==='true','Arrow switch failed');
        checks.push({width,design,context,...geometry,interactions:'passed'});
        await page.close();
      }
    }
  }
  assert(errors.length===0,errors.join('\n'));
  await fs.writeFile(path.join(directory,'verification.json'),JSON.stringify({checks,errors},null,2));
  console.log(`Passed ${checks.length} layout/context/viewport combinations.`);
} finally {await browser.close();}
