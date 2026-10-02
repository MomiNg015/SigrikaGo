import { chromium } from '@playwright/test';
import { readCssWithImports } from '../../src/styles/cssTestUtils.js';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
const page=await browser.newPage({viewport:{width:390,height:844}});
await page.route('**/*',r=>r.abort());
const css=readCssWithImports(new URL('../../src/styles.css',import.meta.url));
await page.setContent(`<style>${css}</style><div class="app-shell player-theme-enabled theme-bright-school"><div class="leaderboard-table capture-leaderboard" style="min-width:0;width:365px"><article class="leaderboard-row top-rank rank-1"><strong class="leaderboard-rank">#1</strong><div class="leaderboard-avatar"></div><div class="leaderboard-player"><strong>moming</strong><span>7段</span></div><span>7段</span><b>11子</b></article></div></div>`,{waitUntil:'domcontentloaded'});
const geometry=await page.locator('.leaderboard-row').evaluate(el=>{const a=el.getBoundingClientRect(),b=el.querySelector('b').getBoundingClientRect();return {row:a.toJSON(),score:b.toJSON(),gap:Math.abs((a.top+a.bottom-b.top-b.bottom)/2)}});
assert.ok(geometry.gap<2,JSON.stringify(geometry));
console.log(JSON.stringify(geometry));
await page.screenshot({path:'.codex-run/capture-challenge/phone-score-centered.png',animations:'disabled'});
} finally {await browser.close()}
