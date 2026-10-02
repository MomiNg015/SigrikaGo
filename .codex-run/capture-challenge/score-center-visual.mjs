import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route('**/api/leaderboard?*',route=>route.fulfill({json:{players:[{id:'a',username:'moming',rank:'7段',captures:11,ranking:1,recordCharacter:'sigrika'}]}}));
 await page.goto('http://127.0.0.1:5189/.codex-run/capture-challenge/preview.html?kind=leaderboard', { waitUntil: 'domcontentloaded' });
 await page.getByRole('tab',{name:'吃子赛'}).click();
 await page.locator('.capture-leaderboard').waitFor();
 await page.screenshot({path:'.codex-run/capture-challenge/phone-score-centered.png',animations:'disabled'});
 const gaps=await page.locator('.capture-leaderboard .leaderboard-row').evaluateAll(rows=>rows.map(row=>{const a=row.getBoundingClientRect(),b=row.querySelector('b').getBoundingClientRect();return Math.abs((a.top+a.bottom-b.top-b.bottom)/2)}));
 assert.ok(gaps.length===2 && gaps.every(gap=>gap<2),JSON.stringify(gaps));
 console.log('List and pinned row center differences:',gaps);
} finally {await browser.close()}

