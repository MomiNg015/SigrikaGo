import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage();
page.on('pageerror',error=>console.log(error.message));
await page.goto('http://127.0.0.1:5178/.codex-run/header-clock.html',{waitUntil:'domcontentloaded'});
await page.waitForSelector('.player-info');
for(const width of [1280,390,360]) {
 await page.setViewportSize({width,height:844});
 for(const turn of ['black','white']) {
  await page.evaluate(({width,turn})=>window.showClock(width<768,turn,'spark',true),{width,turn});
  await page.waitForTimeout(150);
  const state=await page.evaluate(()=>({header:document.querySelector('.room-code-label').textContent,moves:document.querySelector('.move-count').textContent,cards:[...document.querySelectorAll('.player-info')].map(el=>({active:el.classList.contains('active-turn'),shadow:getComputedStyle(el).boxShadow,translate:getComputedStyle(el).translate,width:el.getBoundingClientRect().width})),overflow:document.documentElement.scrollWidth>innerWidth}));
  assert.equal(state.header,'吃子赛AB123');assert.equal(state.moves,'42手');
  for(const card of state.cards){assert.equal(card.translate,card.active?'0px':'3px 3px');assert.equal(card.shadow==='none',!card.active);}
  assert.equal(state.overflow,false); console.log(JSON.stringify({width,turn,...state}));
  await page.screenshot({path:`.codex-run/header-clock-${width}-${turn}.png`});
 }
}
await browser.close();

