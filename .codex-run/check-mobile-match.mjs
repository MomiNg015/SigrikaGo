import { chromium } from '@playwright/test';
const browser = await chromium.launch({headless:true,channel:'msedge'});
const page = await browser.newPage();
for (const [width,height] of [[360,640],[390,844],[412,915]]) {
  await page.setViewportSize({width,height});
  await page.goto('http://localhost:5173/.codex-run/wide-home.html');
  await page.evaluate(async()=>Promise.all(Array.from(document.images).map(i=>i.decode().catch(()=>{}))));
  const overflow = await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth);
  if (overflow) throw new Error(`Horizontal overflow at ${width}`);
  const last = page.locator('.utility-entry').last();
  await last.scrollIntoViewIfNeeded();
  const hit = await last.evaluate(e=>{const r=e.getBoundingClientRect(); return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));});
  if (!hit) throw new Error(`Last entry blocked at ${width}`);
  await page.locator('.match-image-entry').click({trial:true});
  console.log(`${width}x${height}: no horizontal overflow; last utility reachable; match click target available`);
}
await browser.close();
