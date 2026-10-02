import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage();page.on('pageerror',e=>console.log(e.message));
for(const width of [1000,390]){
await page.setViewportSize({width,height:650});await page.goto('http://localhost:5175/.codex-run/guided-actual.html',{waitUntil:'domcontentloaded'});await page.locator('.tutorial-choice-actions button').first().waitFor(); await page.waitForFunction(()=>getComputedStyle(document.querySelector('.tutorial-choice-actions button')).fontWeight==='600');
console.log(width,await page.locator('.tutorial-choice-actions button').first().evaluate(b=>({fill:getComputedStyle(b).backgroundImage,height:b.getBoundingClientRect().height,text:getComputedStyle(b.querySelector('span')).textAlign,arrow:getComputedStyle(b,'::after').display,ring:getComputedStyle(b,'::before').backgroundImage,animation:getComputedStyle(b,'::before').animationName})));
await page.screenshot({path:`.codex-run/guided-redesign-${width}.png`});
}
await page.locator('.tutorial-choice-actions button').first().click();console.log('disabled',await page.locator('.tutorial-choice-actions button').first().evaluate(b=>({disabled:b.disabled,ring:getComputedStyle(b,'::before').animationName})));
await page.emulateMedia({reducedMotion:'reduce'});console.log('reduced',await page.locator('.tutorial-highlight-action').evaluate(b=>({ring:getComputedStyle(b,'::before').animationName,transform:getComputedStyle(b).transform})));
await browser.close();