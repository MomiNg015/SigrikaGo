import {chromium} from 'playwright';
import fs from 'node:fs';
const css=fs.readFileSync('dist/assets/'+fs.readdirSync('dist/assets').find(x=>/^index-.*\.css$/.test(x)),'utf8');
const names=['aemeath','sigrika','denia'];
const slots=names.map((n,i)=>`<div class="team-portrait-slot is-${i===0?'active':'waiting'}"><div class="team-portrait-art"><img src="data:image/webp;base64,${fs.readFileSync('public/assets/characters/portraits/'+n+'.webp').toString('base64')}"></div></div>`).join('');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:800}});
for(const mobile of [false,true]) {
 await page.setViewportSize(mobile?{width:390,height:844}:{width:1280,height:800});
 await page.setContent(`<style>${css}</style><div class="app-shell player-theme-enabled theme-bright-school"><section class="room-screen ${mobile?'mobile-room-screen':''}"><div class="${mobile?'mobile-room-viewport mobile-battle-layout':'battle-layout'}" data-action-anchored><div class="${mobile?'mobile-player-slot mobile-opponent-slot opponent-side':'room-side'}"><aside class="player-info opponent" data-paper-player style="--player-accent:#8ddadc"><div class="portrait-wrap black-portrait"><div class="team-portrait-display"><div class="team-portrait-strip" aria-label="出场顺序">${slots}</div></div></div><div class="player-meta"><div class="name-button player-name">moming</div><span class="meta-tag rank-tag">3段</span><span class="color-badge black"></span></div><div class="player-clock-panel"><div class="timer digital-timer main-time"><div class="timer-label">主时间</div><div class="timer-digits text-clock-value"><span class="timer-primary">04:32</span></div><div class="timer-track"><span style="width:65%"></span></div></div><div class="captures"><span><strong>提子</strong>2</span><button><strong>除子</strong>1</button><button><strong>超频</strong>0</button></div></div><div class="skill-chip-wrap"><button class="skill-chip"><span class="player-skill-name">共鸣技能</span><span class="player-skill-count"> · 1</span></button></div></aside></div></div></section></div>`,{waitUntil:'domcontentloaded'});
 await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 console.log(mobile,await page.locator('.portrait-wrap').boundingBox());
 await page.locator('.player-info').screenshot({path:`.codex-run/mobile-board-team/diagonal-${mobile?'mobile':'desktop'}.png`});
}
await browser.close();
