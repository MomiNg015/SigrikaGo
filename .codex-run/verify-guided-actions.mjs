import { chromium } from '@playwright/test';
const browser = await chromium.launch({headless:true,channel:"msedge"});
const page=await browser.newPage();
for (const [width,height,context] of [[1280,900,'self'],[390,844,'self'],[360,800,'social']]) {
 await page.setViewportSize({width,height});
 await page.goto(`http://localhost:5174/.trellis/tasks/09-18-profile-empty-guide-actions/preview.html?context=${context}`);
 await page.locator('.profile-character-empty').waitFor();
 console.log(JSON.stringify({width,context,...await page.evaluate(()=>({emptyHeight:document.querySelector('.profile-character-empty').getBoundingClientRect().height, table:!!document.querySelector('.profile-character-table'),overflow:document.documentElement.scrollWidth>innerWidth,buttons:[...document.querySelectorAll('button')].filter(b=>b.closest('.tutorial-action-bar,.onboarding-story-actions')).map(b=>({text:b.textContent.slice(0,8),fill:getComputedStyle(b).backgroundColor,ring:getComputedStyle(b,'::before').animationName,content:getComputedStyle(b,'::before').content,mask:getComputedStyle(b,'::before').maskComposite}))}))}));
 await page.screenshot({path:`.trellis/tasks/09-18-profile-empty-guide-actions/preview-${context}-${width}.png`,fullPage:true});
}
await page.goto('http://localhost:5174/.trellis/tasks/09-18-profile-empty-guide-actions/preview.html?guide');
await page.locator('.tutorial-highlight-action').waitFor();
console.log('ringDetails',await page.locator('.tutorial-highlight-action').evaluate(b=>{const s=getComputedStyle(b,'::before');return {opacity:s.opacity,display:s.display,width:s.width,height:s.height,top:s.top,left:s.left,transform:s.transform,visibility:s.visibility,background:s.background,padding:s.padding,zIndex:s.zIndex,filter:s.filter,borderRadius:s.borderRadius}}));
await page.screenshot({path:'.trellis/tasks/09-18-profile-empty-guide-actions/guide-mobile.png',fullPage:true});
await page.emulateMedia({reducedMotion:'reduce'});
console.log('reducedMotion',await page.locator('.tutorial-highlight-action').evaluate(b=>getComputedStyle(b,'::before').animationName));
await browser.close();


