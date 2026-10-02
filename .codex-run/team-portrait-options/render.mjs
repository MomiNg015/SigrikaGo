import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1020,height:780},deviceScaleFactor:1});
page.on('pageerror',e=>{throw e});
await page.goto('file:///C:/codex/SigrikaGo/.codex-run/team-portrait-options/index.html');
for(const id of ['a','b','c']){await page.locator(`[data-id=${id}]`).click();await page.screenshot({path:`.codex-run/team-portrait-options/${id}.png`});}
await browser.close();
