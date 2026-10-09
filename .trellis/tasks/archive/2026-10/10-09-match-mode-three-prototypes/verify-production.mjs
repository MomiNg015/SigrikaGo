import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';

const output='docs/design-samples/match-modes-2026-10-09/production';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:568}]){
    const page=await browser.newPage({viewport});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/**',r=>r.fulfill({json:{traits:[],items:[]}}));
    await page.goto('http://localhost:5290/tests/e2e/fixtures/team-match.html?surface=modes');
    await page.evaluate(()=>document.fonts.ready);
    const window=page.locator('.match-mode-modal');
    await page.screenshot({path:`${output}/${viewport.width}-categories.png`,animations:'disabled'});
    for(const [category,child,mode] of [['星炬对弈','常规匹配','spark'],['标准对弈','常规匹配','standard'],['玩些别的','来下五子棋吗？','gomoku']]){
      await page.evaluate(()=>{delete globalThis.matchSelection;delete globalThis.matchNotice;});
      await window.getByRole('button',{name:category,exact:true}).click();
      if(await page.evaluate(()=>globalThis.matchSelection)!==undefined)throw Error('Category queued directly');
      await window.getByRole('button',{name:child,exact:true}).waitFor();
      await page.screenshot({path:`${output}/${viewport.width}-${mode}.png`,animations:'disabled'});
      const overlap=await window.locator(`.match-mode-submode-${mode==='spark'?'regular':mode}`).evaluate(el=>{
        const range=document.createRange();range.selectNodeContents(el.querySelector('strong'));
        const text=range.getBoundingClientRect(),slot=el.querySelector('.match-character-slots').getBoundingClientRect();
        return text.right>slot.left;
      });
      if(overlap)throw Error(`Child title overlaps character slot: ${viewport.width} ${mode}`);
      await window.getByRole('button',{name:child,exact:true}).click();
      if(await page.evaluate(()=>globalThis.matchNotice)!=='尚未选择角色，无法匹配')throw Error('Missing selection guard');
      await window.getByRole('button',{name:`${child}选择角色`,exact:true}).click();
      await page.getByRole('dialog',{name:'选择角色'}).getByRole('button',{name:'爱弥斯',exact:true}).click();
      await window.getByRole('button',{name:child,exact:true}).click();
      const actual=await page.evaluate(()=>globalThis.matchSelection);
      if(actual?.mode!==mode||actual?.characterId!=='aemeath')throw Error('Wrong match payload');
      await window.getByRole('button',{name:'返回',exact:true}).click();
      if(!(await window.getByRole('button',{name:category,exact:true}).evaluate(el=>el===document.activeElement)))throw Error('Focus not restored');
      if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Horizontal overflow');
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    await window.getByRole('button',{name:'标准对弈',exact:true}).click();
    if(await page.locator('.match-mode-submodes').evaluate(el=>getComputedStyle(el).animationName)!=='none')throw Error('Reduced motion failure');
    if(errors.length)throw Error(errors.join('\n'));
    results.push({viewport,allCategories:true,matchingPayloads:true,selectionGuard:true,focusRestoration:true,horizontalOverflow:false,reducedMotion:true,errors});
    await page.close();
  }
}finally{await browser.close();}
await fs.writeFile(`${output}/results.json`,JSON.stringify(results,null,2));
console.log(JSON.stringify(results));
