import { chromium } from "playwright";
const browser = await chromium.launch({headless:true,channel:"msedge"});
const page = await browser.newPage();
const errors=[];
page.on("pageerror", error=>errors.push(error.message));
const results=[];
for(const width of [1280,360,390,412]){
 await page.setViewportSize({width,height:width===1280?900:844});
 for(const view of ["battle"]){
  await page.goto("http://127.0.0.1:5199/.codex-run/rank-stars-ui.html?view="+view, {waitUntil:"domcontentloaded",timeout:60000});
  await page.waitForSelector(".rank-progress:visible", {timeout:60000});
  await page.screenshot({animations:"disabled",path:".codex-run/rank-"+view+"-"+width+".png"});
  results.push(await page.evaluate(({view,width})=>({
   view,width,overflow:document.documentElement.scrollWidth>innerWidth,
   summary:document.querySelector(".profile-summary-grid") && getComputedStyle(document.querySelector(".profile-summary-grid")).gridTemplateColumns,
   ranks:[...document.querySelectorAll(".rank-progress")].map(el=>({label:el.getAttribute("aria-label"),width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,stars:[...el.querySelectorAll("svg")].map(s=>Math.round(s.getBoundingClientRect().top)),visible:el.getBoundingClientRect().width>0}))
  }),{view,width}));
 }
}
console.log(JSON.stringify({errors,results},null,2));
await browser.close();
