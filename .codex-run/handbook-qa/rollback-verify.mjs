import {chromium} from '@playwright/test';
const b=await chromium.launch({channel:'msedge',headless:true});
const p=await b.newPage();
for(const [width,height] of [[1440,1000],[390,844],[360,640]]) {
 await p.setViewportSize({width,height}); await p.goto('http://localhost:5173/.codex-run/handbook-qa/'); await p.waitForTimeout(500);
 await p.screenshot({path:`.codex-run/handbook-qa/rollback-${width}.png`});
 console.log(await p.evaluate(()=>({width:innerWidth,columns:getComputedStyle(document.querySelector('.character-grid-container')).gridTemplateColumns,window:document.querySelector('.house-modal').getBoundingClientRect().toJSON(),grid:document.querySelector('.character-grid-container').getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth,art:!!document.querySelector('.handbook-open-art')})));
 const reachable=await p.locator('.character-grid-container').evaluate(e=>{e.scrollTop=e.scrollHeight; const last=e.querySelector('.portrait-card:last-child').getBoundingClientRect();return last.bottom<=e.getBoundingClientRect().bottom+1;});
 if(!reachable)throw new Error('Last character unreachable');
 await p.locator('.character-grid-container').evaluate(e=>e.scrollTop=0);
 await p.locator('.portrait-card').first().click();
 if(!await p.locator('.character-details-modal').isVisible())throw new Error('Details failed');
 await p.reload();
 await p.getByRole('tab',{name:'装饰',exact:true}).click();
 await p.screenshot({path:`.codex-run/handbook-qa/rollback-decorations-${width}.png`});
 if(!await p.getByRole('tabpanel',{name:'装饰',exact:true}).isVisible())throw new Error('Decoration switch failed');
 await p.getByRole('tab',{name:'装饰',exact:true}).press('Home');
 if(!await p.getByRole('tabpanel',{name:'角色',exact:true}).isVisible())throw new Error('Keyboard switch failed');
}
await b.close();
