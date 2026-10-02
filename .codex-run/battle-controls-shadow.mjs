import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:1280,height:800}});
page.on('pageerror',error=>console.log(error.message));
page.on('console',message=>{if(message.type()==='error') console.log(message.text())});
await page.goto('http://localhost:5178/.codex-run/battle-controls-shadow.html',{waitUntil:'domcontentloaded'});
await page.waitForSelector('.room-person');
for(const mobile of [false,true]) {
  await page.setViewportSize(mobile?{width:390,height:844}:{width:1280,height:800});
  for(const extra of [0,8]) {
    await page.evaluate(({extra,mobile})=>window.showFixture(extra,mobile),{extra,mobile});
    await page.waitForTimeout(200);
    await page.locator('.room-people-table').evaluate(el=>el.scrollTop=el.scrollHeight);
    await page.locator('.room-person').last().hover();
    console.log(JSON.stringify(await page.evaluate(()=>{const table=document.querySelector('.room-people-table'), row=table.lastElementChild.firstElementChild, t=table.getBoundingClientRect(), r=row.getBoundingClientRect();return {viewport:innerWidth,rows:table.children.length,gutterRight:t.right-r.right,gutterBottom:t.bottom-r.bottom,shadow:getComputedStyle(row).boxShadow,buttons:[...document.querySelectorAll('.action-bar button')].map(b=>({text:b.textContent,disabled:b.disabled,background:getComputedStyle(b).backgroundColor}))}})));
    await page.screenshot({path:`.codex-run/battle-shadow-${mobile?'mobile':'desktop'}-${extra}.png`});
  }
}
await browser.close();

