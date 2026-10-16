import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import config from '../../../eslint.config.js';

const output = fileURLToPath(new URL('./', import.meta.url));
const base = 'http://127.0.0.1:5173/docs/design-samples/handbook-detail-2026-10-15/';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [], requests = [], results = [];
const sizes = [{width:1440,height:900,name:'desktop'}, {width:390,height:844,name:'mobile'}, {width:320,height:568,name:'small'}];
async function ready(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.figure-area img').evaluateAll(images => Promise.all(images.map(img => img.decode().catch(() => {}))));
}
try {
  for (const view of ['dossier','stage','notebook']) for (const size of sizes) for (const character of ['denia','sigrika']) {
    const page = await browser.newPage({ viewport: size });
    page.on('pageerror', error => errors.push(`${view}/${size.name}/${character}: ${error.message}`));
    page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) requests.push(request.url()); });
    await page.goto(`${base}preview.html?view=${view}&character=${character}`);
    await page.locator('.lab-window').waitFor();
    await ready(page);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'document must not overflow');
    const capture = size.name !== 'small' && character === 'denia';
    if (capture) await page.screenshot({path:`${output}${view}-detail-${size.name}.png`});
    if (character === 'sigrika') {
      await page.getByRole('button',{name:'特性词【疾走】，点击查看释义'}).click();
      await page.locator('.skill-trait-popover').waitFor();
      const popup = await page.locator('.skill-trait-popover').boundingBox();
      assert(popup.x >= 0 && popup.x + popup.width <= size.width, 'trait explanation stays in viewport');
      await page.locator('.paper-title').click();
      assert.equal(await page.locator('.skill-trait-popover').count(),0);
    }
    if (view === 'notebook') {
      await page.getByRole('button', {name:'02人物'}).click();
      await page.getByRole('button', {name:/听听她的声音/}).waitFor();
      await page.getByRole('button', {name:'01技能'}).click();
    }
    await page.locator('.page-tabs button').last().click();
    await page.locator('.costume-option').nth(1).click();
    await ready(page);
    const confirm = page.getByRole('button',{name:'换上这套',exact:true});
    assert.equal(await confirm.isEnabled(), true);
    const bounds = await confirm.boundingBox();
    assert(bounds.y >= 0 && bounds.y + bounds.height <= size.height, 'confirmation stays visible');
    assert.equal(await page.evaluate(() => document.querySelector('.content-side').scrollWidth > document.querySelector('.content-side').clientWidth), false, 'content must not overflow horizontally');
    await page.locator('.costume-option img').evaluateAll(images => Promise.all(images.map(img => img.decode().catch(() => {}))));
    if (capture) await page.screenshot({path:`${output}${view}-wardrobe-${size.name}.png`});
    await confirm.click();
    await page.getByRole('button',{name:'正在穿戴',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'正在穿戴',exact:true}).isDisabled(), true);
    if (character === 'denia') {
      await page.locator('.costume-option.locked').click();
      assert.equal(await page.getByRole('button',{name:'尚未拥有',exact:true}).isDisabled(), true);
      assert.match(await page.locator('.costume-copy').textContent(), /黯影形态/);
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.lab-window.is-wardrobe').count(), 0);
    assert.equal(await page.locator('.figure-label').textContent(), character === 'denia' ? '睡眠不足' : 'HelloHello');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>Boolean(document.activeElement.closest('[role="dialog"]'))),true);
    await page.getByRole('button',{name:'关闭窗口',exact:true}).click();
    assert.equal(await page.locator('.lab-window').count(),0);
    await page.getByRole('button',{name:'打开角色详情',exact:true}).click();
    await page.locator('.lab-window').waitFor();
    assert.equal(await page.locator('img').evaluateAll(images => images.some(img => img.complete && img.naturalWidth === 0)),false);
    results.push({view,character,viewport:`${size.width}x${size.height}`,detail:true,wardrobe:true,equip:true,keyboard:true});
    await page.close();
  }
  // Real components, rendered with the same local fixture, for review evidence.
  for (const size of sizes.slice(0,2)) {
    const page = await browser.newPage({viewport:size});
    page.on('pageerror',e=>errors.push(`current: ${e.message}`));
    page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/'))requests.push(r.url());});
    await page.goto(`${base}preview.html?view=current`);
    await page.locator('.character-detail').waitFor();
    await page.evaluate(()=>document.fonts.ready);
    await page.locator('.character-detail img').evaluateAll(images=>Promise.all(images.map(i=>i.decode().catch(()=>{}))));
    await page.screenshot({path:`${output}current-detail-${size.name}.png`});
    await page.getByRole('button',{name:'查看达妮娅的服装'}).click();
    await page.locator('.character-costume-dialog').waitFor();
    await page.locator('.character-costume-dialog img').evaluateAll(images=>Promise.all(images.map(i=>i.decode().catch(()=>{}))));
    await page.screenshot({path:`${output}current-wardrobe-${size.name}.png`});
    await page.close();
  }
  const page = await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(base);
  for (const label of ['2 立绘展台','3 随身手账','1 夹页档案']) {
    await page.getByRole('button',{name:label,exact:true}).click();
    await page.frameLocator('iframe').locator('.lab-window').waitFor();
  }
  await page.locator('#size').selectOption('phone');
  assert.equal(Math.round((await page.locator('iframe').boundingBox()).width),390);
  await page.close();
  const audioPage = await browser.newPage({viewport:{width:390,height:844}});
  await audioPage.addInitScript(() => {
    const NativeAudio = window.Audio;
    window.sampleAudio = [];
    window.Audio = function (...args) { const audio = new NativeAudio(...args); window.sampleAudio.push(audio); return audio; };
  });
  await audioPage.goto(`${base}preview.html?view=stage`);
  await audioPage.getByRole('button',{name:'试听技能音乐',exact:true}).click();
  await audioPage.getByRole('button',{name:'暂停技能音乐',exact:true}).waitFor();
  await audioPage.getByRole('button',{name:'暂停技能音乐',exact:true}).click();
  assert.equal(await audioPage.evaluate(()=>window.sampleAudio.every(a=>a.paused)),true);
  await audioPage.getByRole('button',{name:/听听她的声音/}).click();
  await audioPage.getByRole('button',{name:/停止语音/}).waitFor();
  await audioPage.getByRole('button',{name:'关闭窗口',exact:true}).click();
  assert.equal(await audioPage.evaluate(()=>window.sampleAudio.every(a=>a.paused)),true);
  await audioPage.close();
  assert.deepEqual(errors,[]);
  assert.deepEqual(requests,[]);
  // The repository's normal lint file list excludes design samples; apply the same rules explicitly.
  const eslint = new ESLint({overrideConfigFile:true,overrideConfig:[...config.map(entry=>entry.files?{...entry,files:['docs/design-samples/handbook-detail-2026-10-15/*.{jsx,mjs}']}:entry)]});
  const lint = await eslint.lintFiles([`${output}sample.jsx`, `${output}verify.mjs`]);
  const formatter = await eslint.loadFormatter('stylish');
  console.log(formatter.format(lint));
  assert.equal(lint.reduce((sum,file)=>sum+file.errorCount+file.warningCount,0),0,'sample lint must pass');
  await writeFile(`${output}verification.json`,JSON.stringify({results,errors,apiRequests:requests,lint:'passed'},null,2)+'\n');
  console.log(`Passed ${results.length} character/viewport scenarios, current comparison and picker; no API requests.`);
} finally { await browser.close(); }
