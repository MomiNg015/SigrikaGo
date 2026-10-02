import {chromium} from '@playwright/test';
const b=await chromium.launch({channel:'msedge',headless:true}); const p=await b.newPage();
for(const [width,height] of [[1440,1000],[390,844]]){
 await p.setViewportSize({width,height}); await p.goto('http://localhost:5173/.codex-run/handbook-qa/'); await p.getByRole('tab',{name:'装饰',exact:true}).click();
 const result=await p.getByRole('tabpanel',{name:'装饰',exact:true}).evaluate(e=>({topBorder:getComputedStyle(e).borderTopWidth,headings:e.querySelectorAll('h3').length,first:e.querySelector('button').getAttribute('aria-label'),stones:[...e.querySelectorAll('.stone-decoration-preview span')].map(s=>getComputedStyle(s).backgroundImage),overflow:document.documentElement.scrollWidth>innerWidth}));
 if(result.topBorder!=='0px'||result.headings||result.first!=='默认棋子'||result.stones.some(s=>s==='none')||result.overflow)throw new Error(JSON.stringify(result));
 await p.screenshot({path:`.codex-run/handbook-qa/default-stones-${width}.png`}); console.log({width,...result});
}
await b.close();
