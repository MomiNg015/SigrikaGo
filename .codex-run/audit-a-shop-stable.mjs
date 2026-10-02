import {chromium} from '@playwright/test';
import {RECRUITMENT_ITEMS} from '../src/shared/recruitment.js';
const browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage();
const items=Object.values(RECRUITMENT_ITEMS).map((v,i)=>({...v,id:String(i),itemId:v.itemType,quantity:3,category:'item',finalPrice:120,purchasable:true,targetType:'self',confidenceText:'可以招募学院内的人'}));
await page.route('http://localhost:5175/api/**',r=>r.fulfill({json:{items,utilities:[],task:null,costumes:[]}}));
for(const width of [1440,390]){await page.setViewportSize({width,height:width===390?844:1000});for(const view of ['shop']){await page.goto('http://localhost:5175/.codex-run/audit-a.html?view='+view,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(3000);await page.screenshot({path:`.codex-run/audit-a-${view}-populated-${width}.png`});if(view==='shop')console.log(width,await page.locator('.shop-mascot-bubble').evaluate(e=>{let s=getComputedStyle(e),r=e.getBoundingClientRect();return {text:e.textContent,width:r.width,height:r.height,padding:s.padding,font:s.fontSize,lineHeight:s.lineHeight,overflow:s.overflow}}));}}
await browser.close();

