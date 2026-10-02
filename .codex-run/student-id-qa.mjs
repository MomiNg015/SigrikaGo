import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true,channel:"msedge"});
const page=await browser.newPage();
page.on('pageerror',e=>console.log('PAGE_ERROR',e.message));
for(const [w,h] of [[1440,900],[390,844],[360,800],[412,915]]){
 await page.setViewportSize({width:w,height:h});
 await page.goto('http://127.0.0.1:5173/.codex-run/student-id-preview.html',{waitUntil:'domcontentloaded'});
 await page.locator('.home-student-id-portrait img').waitFor();
 await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,2000))]));
 await page.waitForTimeout(700);
 console.log(w,await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,portraitLoaded:document.querySelector('.home-student-id-portrait img').naturalWidth>0,card:document.querySelector('.home-student-id').getBoundingClientRect().toJSON(),portrait:document.querySelector('.home-student-id-portrait').getBoundingClientRect().toJSON()})));
 console.log('button style',await page.locator('.home-student-id').evaluate(e=>({background:getComputedStyle(e).background,border:getComputedStyle(e).border,shadow:getComputedStyle(e).boxShadow})));
 await page.screenshot({path:`.codex-run/student-id-${w}.png`,fullPage:true});
}
await page.getByRole('button',{name:'打开履历',exact:true}).click();
console.log('resume click',await page.evaluate(()=>window.resumeOpened));
await page.evaluate(()=>{window.resumeOpened=false;});
await page.getByRole('button',{name:'打开履历',exact:true}).focus();
await page.keyboard.press('Enter');
console.log('resume keyboard',await page.evaluate(()=>window.resumeOpened));
await page.evaluate(()=>window.renderStudentId({username:'星炬学院十二字用户名测试',selectedCharacter:'denia'}));
await page.waitForTimeout(300);
console.log('long name',await page.locator('.home-student-id-name').evaluate(e=>({text:e.textContent,clipped:e.scrollHeight>e.clientHeight||e.scrollWidth>e.clientWidth})));
console.log('changed character',await page.locator('.home-student-id-portrait img').getAttribute('src'));
await page.emulateMedia({reducedMotion:'reduce'});
console.log('reduced motion',await page.locator('.home-student-id').evaluate(e=>getComputedStyle(e).transitionDuration));
await page.evaluate(()=>window.renderStudentId());
await page.waitForTimeout(150);
await page.locator('.home-student-id').screenshot({path:'.codex-run/student-id-card-preview.png'});
await browser.close();


