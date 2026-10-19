import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const base = process.env.SAMPLE_ORIGIN || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const checks = [];
const errors = [];
const page = await browser.newPage();
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('response', response => { if(response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) errors.push(`Unexpected account request: ${request.url()}`); });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
try {
  for (const direction of ['archive', 'terminal', 'portrait']) {
    for (const viewport of [{ width:1440,height:900 },{ width:768,height:1024 },{ width:390,height:844 },{ width:320,height:568 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`${base}/docs/design-samples/profile-fusion-2026-10-19/${direction}.html`);
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode())); });
      const geometry = await page.evaluate(() => ({
        overflow:document.documentElement.scrollWidth > innerWidth,
        images:[...document.images].every(image => image.complete && image.naturalWidth > 0),
        rows:document.querySelectorAll('.character-row').length,
        hero:document.querySelector('.hero-art').getBoundingClientRect().toJSON()
      }));
      assert(!geometry.overflow && geometry.images && geometry.rows === 4, `${direction} ${viewport.width} baseline: ${JSON.stringify(geometry)}`);
      if (viewport.width === 1440 || viewport.width === 390) await page.screenshot({path:path.join(directory,`${direction}-${viewport.width}.png`),fullPage:true});
      await page.locator('[data-context="social"]').click();
      await page.locator('[data-action="like"]').click();
      assert(await page.locator('[data-action="like"]').isDisabled(),'Like must only apply once');
      await page.locator('[data-action="friend"]').click();
      assert(await page.locator('[data-action="friend"]').isDisabled(),'Friend must show pending');
      await page.locator('[data-action="more"]').click();
      await page.locator('[data-action="block"]').click();
      await page.locator('[data-action="confirm-block"]').click();
      await page.locator('[data-action="more"]').click();
      assert((await page.locator('[data-action="block"]').innerText()).includes('移出'),'Block state must persist locally');
      await page.locator('[data-action="report"]').click();
      await page.locator('[name="reason"]').selectOption({label:'恶意骚扰'});
      await page.locator('[name="detail"]').fill('样板测试，不发送举报');
      await page.locator('button[type="submit"]').click();
      assert(!(await page.locator('dialog').evaluate(node=>node.open)),'Report preview closes');
      await page.locator('[data-play="team"]').click();
      assert((await page.locator('.stats-panel h3').innerText()).includes('队际赛'),'Team summary');
      await page.locator('[data-play="capture"]').click();
      assert(await page.locator('.capture-score').count()===1 && await page.locator('.rank-panel').count()===0,'Capture replaces ordinary rank');
      await page.locator('[data-mode="standard"]').click();
      assert(await page.locator('[data-play]').count()===1,'Standard has no Spark branches');
      await page.locator('[data-mode="other"]').click();
      assert((await page.locator('.plain-mode h3').innerText())==='五子棋','Other branch');
      await page.locator('[data-mode="spark"]').click();
      await page.locator('#fixture').selectOption('empty');
      assert(await page.locator('.character-row').count()===0,'Empty records');
      assert((await page.locator('.empty-inline').innerText()).includes('没有'),'Empty recent');
      await page.locator('#fixture').selectOption('long');
      const longGeometry = await page.evaluate(()=> {
        const title=document.querySelector('.identity-copy').getBoundingClientRect();
        const actions=document.querySelector('.identity-actions').getBoundingClientRect();
        return { overflow:document.documentElement.scrollWidth>innerWidth, intersects:title.left<actions.right&&title.right>actions.left&&title.top<actions.bottom&&title.bottom>actions.top };
      });
      assert(!longGeometry.overflow&&!longGeometry.intersects,`${direction} long name ${viewport.width}: ${JSON.stringify(longGeometry)}`);
      if(viewport.width===320) {
        await page.locator('.toast').evaluate(node=>node.classList.remove('visible'));
        await page.screenshot({path:path.join(directory,`${direction}-long-320.png`),fullPage:true});
      }
      await page.locator('#fixture').selectOption('normal');
      await page.locator('.character-row').last().click();
      assert((await page.locator('#dialog-title').innerText()).includes('达妮娅'),'Last record reachable');
      await page.keyboard.press('Escape');
      assert(await page.locator('.character-row').last().evaluate(node=>node===document.activeElement),'Native dialog restores row focus');
      await page.locator('[data-context="self"]').click();
      await page.locator('[data-action="personalize"]').click();
      await page.locator('[data-pick="aemeath"]').click();
      assert((await page.locator('.hero-art').getAttribute('src')).includes('aemeath'),'Personalization only changes display');
      await page.locator('[data-action="achievements"]').click();
      await page.keyboard.press('Escape');
      await page.locator('[data-action="replays"]').click();
      assert(await page.locator('.replay-row').count()===3,'Replay list demo');
      await page.keyboard.press('Escape');
      await page.locator('[data-mode="spark"]').focus();
      await page.keyboard.press('ArrowRight');
      assert(await page.locator('[data-mode="standard"]').getAttribute('aria-pressed')==='true','Arrow key family navigation');
      await page.locator('[data-action="close"]').click();
      await page.locator('[data-action="reopen"]').click();
      checks.push({direction,...viewport,geometry,longGeometry,interactions:'passed'});
    }
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${base}/docs/design-samples/profile-fusion-2026-10-19/index.html`);
  for(const direction of ['archive','terminal','portrait']) {
    await page.locator(`[data-direction="${direction}"]`).click();
    await page.locator('button[data-device="phone"]').click();
    assert((await page.locator('iframe').boundingBox()).width===390,'Phone preview is actual 390px');
    assert((await page.locator('iframe').getAttribute('src')).includes(direction),'Picker changes sample');
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(`${base}/docs/design-samples/profile-fusion-2026-10-19/portrait.html`);
  assert(await page.locator('.identity-actions button').first().evaluate(node=>getComputedStyle(node).transitionDuration)==='0s','Reduced motion');
  assert(errors.length===0,`Browser errors: ${errors.join('; ')}`);
  await fs.writeFile(path.join(directory,'verification.json'),JSON.stringify({checks,errors,picker:'passed',reducedMotion:'passed'},null,2));
  console.log(`PASS: ${checks.length} viewport/direction combinations; all interactions, picker and reduced motion; zero errors or API requests.`);
} finally { await browser.close(); }
