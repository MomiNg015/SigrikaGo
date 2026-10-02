import { chromium } from 'playwright';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:900}});
await page.goto('http://localhost:5173/.codex-run/clock-review.html');
await page.waitForFunction(()=>window.renderBot);
for(const active of [true,false]){
 await page.evaluate(active=>window.renderBot(false,{main:0,byoYomi:30,periodRemaining:6,periods:3},active),active);
 await page.waitForTimeout(400); await page.evaluate(()=>document.fonts.ready);
 console.log(active,await page.locator('.digital-timer').evaluate(e=>({translate:getComputedStyle(e).translate,shadow:getComputedStyle(e).boxShadow,width:e.getBoundingClientRect().width,primary:getComputedStyle(e.querySelector('.timer-primary')).minWidth,period:e.querySelector('.timer-periods').getBoundingClientRect().x-e.querySelector('.timer-primary').getBoundingClientRect().right})));
 await page.locator('.player-clock-panel').screenshot({path:`.codex-run/clock-${active?'raised':'pressed'}.png`});
}
await browser.close();
