import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const output='.codex-run/match-mode-mobile-fixes';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
try{
  for(const width of [1440,390,320]){
    const page=await browser.newPage({viewport:{width,height:width===1440?900:844}});
    await page.route('**/api/**',r=>r.fulfill({json:{traits:[],items:[]}}));
    await page.goto('http://127.0.0.1:5290/tests/e2e/fixtures/team-match.html?surface=modes');
    await page.evaluate(()=>document.fonts.ready);
    const modal=page.locator('.match-mode-modal');
    const watermark=await modal.locator('.match-mode-sibling-gomoku .match-mode-watermark-label').textContent();
    if(watermark!=='other mode')throw Error('Other watermark mismatch');
    const info=await modal.locator('.match-mode-category > .match-mode-info-button').evaluateAll(elements=>elements.map(el=>getComputedStyle(el).display));
    if(width<=768&&info.some(value=>value!=='none'))throw Error('Category info visible');
    for(const category of ['星炬对弈','标准对弈','玩些别的']){
      await modal.getByRole('button',{name:category,exact:true}).click();
      await modal.evaluate(el=>Promise.all(el.getAnimations({subtree:true}).filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));
      const measure=async()=>{
        await page.mouse.move(0,0);
        const geometry=await modal.locator('.match-mode-submode').evaluateAll(elements=>elements.map(el=>{
          const card=el.querySelector('.match-mode-option').getBoundingClientRect();
          return [...el.querySelectorAll('.match-character-slot')].map(slot=>{const box=slot.getBoundingClientRect(),wrap=el.getBoundingClientRect(),slots=slot.parentElement.getBoundingClientRect(),style=getComputedStyle(slot.parentElement),ws=getComputedStyle(el),cs=getComputedStyle(el.querySelector('.match-mode-option'));return {title:el.querySelector('strong').textContent,filled:slot.dataset.filled,delta:Math.abs((box.top+box.bottom-card.top-card.bottom)/2),cardHeight:card.height,wrapperHeight:wrap.height,slotsHeight:slots.height,top:style.top,bottom:style.bottom,transform:style.transform,align:style.alignItems,padding:ws.padding,display:ws.display,cardMargin:cs.margin,grid:ws.gridTemplateRows};});
        }).flat());
        if(geometry.some(g=>g.delta>1))throw Error(`Not centered ${width} ${category}: `+JSON.stringify(geometry));
        return geometry;
      };
      const empty=await measure();
      if(width<=768){const childInfo=await modal.locator('.match-mode-submode .match-mode-info-button').evaluateAll(es=>es.map(e=>getComputedStyle(e).display));if(childInfo.some(v=>v==='none'))throw Error('Child info hidden');}
      await modal.locator('.match-character-slot').first().click();
      await page.getByRole('dialog',{name:'选择角色'}).getByRole('button',{name:'爱弥斯',exact:true}).click();
      await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
      const filled=await measure();
      await page.screenshot({path:`${output}/${width}-${category}.png`,animations:'disabled'});
      results.push({width,category,empty,filled,categoryInfo:info});
      await modal.getByRole('button',{name:'返回',exact:true}).click();
    }
    await page.close();
  }
}finally{await browser.close();}
await fs.writeFile(`${output}/results.json`,JSON.stringify(results,null,2));
console.log(`Passed ${results.length} category/viewport cases; filled and empty slots centered.`);
