import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
let players = [];
await page.route('**/api/leaderboard?*', route => route.fulfill({ json: { players } }));
try {
  for (const [name, width, height] of [['desktop',1440,900],['phone',390,844],['small-phone',360,640]]) {
    await page.setViewportSize({ width, height });
    for (const count of [0,1]) {
      players = count ? [{ id:'b',username:'挑战者',rank:'3段',captures:1,ranking:1,recordCharacter:'sigrika' }] : [];
      await page.goto('http://127.0.0.1:5189/.codex-run/capture-challenge/preview.html?kind=leaderboard');
      await page.getByRole('tab',{name:'吃子赛'}).click();
      const geometry = await page.locator('.window-bookmark-rail').evaluate(rail => ({ height:rail.clientHeight, content:rail.scrollHeight }));
      assert.ok(geometry.content <= geometry.height, `${name} ${count}: ${JSON.stringify(geometry)}`);
      await page.screenshot({path:`.codex-run/capture-challenge/${name}-leaderboard-${count}.png`,animations:'disabled'});
    }
    await page.goto('http://127.0.0.1:5189/.codex-run/capture-challenge/preview.html?kind=result');
    const stamp = page.locator('.capture-challenge-breakthrough');
    await stamp.waitFor();
    assert.equal(await stamp.evaluate(el=>getComputedStyle(el).animationName),'capture-record-stamp');
    await page.screenshot({path:`.codex-run/capture-challenge/${name}-stamp.png`,animations:'disabled'});
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await stamp.evaluate(el=>getComputedStyle(el).animationName),'none');
    await page.emulateMedia({reducedMotion:'no-preference'});
    console.log(name, 'empty/single leaderboard and stamp passed');
  }
  await page.setViewportSize({width:1440,height:900});
  await page.goto('http://127.0.0.1:5189/.codex-run/capture-challenge/preview.html?kind=header');
  const coords=page.getByTitle('显示坐标');
  const state=()=>coords.evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,transform:s.transform,shadow:s.boxShadow}});
  const before=await state();
  await coords.click();
  await page.mouse.move(0,0);
  await page.waitForTimeout(200);
  const after=await state();
  assert.equal(after.background,before.background);
  assert.equal(after.transform,'matrix(1, 0, 0, 1, 2, 2)');
  assert.notEqual(after.shadow,before.shadow);
  await page.screenshot({path:'.codex-run/capture-challenge/coordinate-pressed.png',animations:'disabled'});
  console.log('coordinate',JSON.stringify({before,after}));
} finally { await browser.close(); }
