import { chromium } from 'playwright';
import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = new URL('./', import.meta.url);
const base = process.env.SHOP_MATERIAL_URL || 'http://127.0.0.1:5173/docs/design-samples/shop-window-2026-10-23/materials/';
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
const page = await browser.newPage();
const errors = [], geometry = [], interactions = [];
page.on('pageerror', e => errors.push(e.message));
page.on('request', r => { if (new URL(r.url()).pathname.startsWith('/api/')) errors.push(`Unexpected network API: ${r.url()}`); });

async function ready() {
  await page.locator('.shop-window').waitFor();
  await page.locator('.shop-layout[data-catalog-state="ready"]').waitFor();
  await page.evaluate(async () => { document.querySelectorAll('img').forEach(e => { e.loading = 'eager'; }); await document.fonts.ready; });
  await page.waitForFunction(() => [...document.images].every(e => e.complete && e.naturalWidth > 0));
  await page.evaluate(async () => { await Promise.all([...document.images].map(e => e.decode())); });
}
async function settle() {
  await page.evaluate(async () => {
    for (let i = 0; i < 2; i++) {
      for (const a of document.getAnimations()) {
        const t = a.effect.getComputedTiming();
        a.pause(); a.currentTime = t.iterations === Infinity ? 0 : t.endTime;
      }
      await new Promise(requestAnimationFrame);
    }
  });
}
async function snapshot(store) {
  await settle();
  return page.evaluate(store => {
    const scope = store === 'zahira' ? '.zahira-store-page' : '.costume-store-page';
    const selectors = ['.shop-window', '.shop-header', '.shop-header h2', '.shop-refresh-button', '.shop-close-button', '.shop-header-balance',
      ...['.shop-card-position', '.shop-card-scale', '.shop-card-rotation', '.shop-card-float', '.shop-item', '.shop-product-stage', '.costume-shop-stage', '.shop-mascot-slot', '.costume-shop-mascot-slot', '.shop-mascot-bubble', '.costume-shop-bubble', '.shop-switch-button'].map(s => `${scope} ${s}`)];
    return selectors.flatMap(selector => [...document.querySelectorAll(selector)].map((e, index) => {
      const r = e.getBoundingClientRect(), s = getComputedStyle(e);
      return { selector, index, rect: [r.x, r.y, r.width, r.height].map(n => Math.round(n * 100) / 100), animation: [s.animationName, s.animationDuration, s.animationTimingFunction, s.animationIterationCount] };
    }));
  }, store);
}
async function shot(name) { await page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, root)), animations: 'disabled' }); }

const record = process.argv.includes('--record-baseline');
const baseline = record ? {} : JSON.parse(readFileSync(new URL('production-baseline.json', root), 'utf8'));
try {
  for (const size of [{width:1440,height:900,label:'desktop'},{width:390,height:844,label:'mobile'},{width:320,height:568,label:'narrow'}]) {
    await page.setViewportSize(size);
    await page.goto(base + (record ? 'preview.html?skin=original' : 'production.html'));
    await ready();
    for (const store of ['zahira','costume']) {
      if (store === 'costume') await page.locator('.zahira-to-costume').click();
      const actual = await snapshot(store);
      const key = store + '-' + size.label;
      if (record) baseline[key] = actual;
      else {
        assert.deepEqual(actual, baseline[key], key + ': geometry or animation changed');
        const paints = await page.evaluate(() => {
          const stone = getComputedStyle(document.querySelector('.shop-category-decoration .stone-decoration-preview'));
          const card = getComputedStyle(document.querySelector('.shop-item'));
          return {sampleRoot:!!document.querySelector('#shop-materials'),texture:card.backgroundImage,stoneFill:stone.backgroundColor,stoneBorder:stone.borderColor,overflow:document.documentElement.scrollWidth > innerWidth};
        });
        assert.deepEqual(paints,{sampleRoot:false,texture:'none',stoneFill:'rgba(0, 0, 0, 0)',stoneBorder:'rgba(0, 0, 0, 0)',overflow:false});
        geometry.push({key,comparedElements:actual.length,geometryAndAnimationsUnchanged:true,...paints});
        await shot('production-' + key);
      }
    }
  }
  if (!record) {
    await page.goto(base+'production.html');await ready();await settle();
    const candy=page.locator('.shop-item').filter({hasText:'彩虹豆豆跳跳糖'});
    await candy.locator('.shop-item-detail-trigger').click();
    await page.locator('.shop-item-detail-modal .close-button').click();
    await candy.locator('.primary-action').click();
    await page.waitForFunction(()=>document.querySelector('.shop-header-balance-value').textContent==='1270');
    await page.locator('.zahira-to-costume').click();await settle();
    await page.locator('.costume-shop-card-trigger').first().click();
    await page.locator('.costume-detail-purchase-button').click();
    await page.getByRole('button',{name:'立即装扮',exact:true}).click();
    await page.locator('.costume-equip-prompt-modal').waitFor({state:'hidden'});
    assert.equal(await page.locator('.shop-header-balance-value').innerText(),'670');
    await page.getByRole('button',{name:'关闭商店',exact:true}).click();
    await page.getByRole('button',{name:'重新打开商店',exact:true}).click();
    await page.locator('.shop-window').waitFor();
    interactions.push('details, purchase, store switch, costume purchase/equip, close/reopen');
    assert.deepEqual(errors,[]);
  }
  writeFileSync(new URL(record?'production-baseline.json':'production-verification.json',root),JSON.stringify(record?baseline:{geometry,interactions,errors},null,2)+'\n');
  console.log(record?'Saved six pre-integration geometry/animation baselines.':'Passed six production geometry/paint cases and purchase flow.');
} finally {await browser.close();}
