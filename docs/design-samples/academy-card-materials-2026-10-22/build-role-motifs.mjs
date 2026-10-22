import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const ink = '#606962';
const wrap = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">${body}</svg>`;
function dots({x,y,columns,rows,step=15,accept=()=>true,square=false}) {
  let result = '';
  for(let row=0;row<rows;row++) for(let col=0;col<columns;col++) {
    const px=x+col*step, py=y+row*step;
    if(!accept(px,py))continue;
    const r=.6+2.1*(col+row)/(columns+rows-2);
    result+=square?`<rect x="${px}" y="${py}" width="${(r*2).toFixed(2)}" height="${(r*2).toFixed(2)}"/>`:`<circle cx="${px}" cy="${py}" r="${r.toFixed(2)}"/>`;
  }
  return `<g fill="${ink}" opacity=".2">${result}</g>`;
}
const motifs = {
  identity: wrap(`<path d="M340 0H600V286L548 234V80H420Z" fill="${ink}" opacity=".17"/><path d="M450 0H600V178L498 76H450Z" fill="${ink}" opacity=".09"/><path d="M600 330 390 120h-58l268 268Z" fill="${ink}" opacity=".12"/><path d="M432 70h38v38h-38zm61 61h23v23h-23z" fill="${ink}" opacity=".24"/>${dots({x:360,y:20,columns:16,rows:27,accept:(x,y)=>x-y>240&&x<548})}`),
  record: wrap(`<path d="M0 600V449h62v52h63v49h64v50Z" fill="${ink}" opacity=".16"/><path d="M26 374h40v40H26zm74 72h40v40h-40zm74 72h40v40h-40zm74 55h27v27h-27Z" fill="${ink}" opacity=".18"/><path d="M0 510h38v90H0Z" fill="${ink}" opacity=".1"/>${dots({x:18,y:325,columns:28,rows:19,square:true,accept:(x,y)=>y-x>240&&x+y>440})}`),
  social: wrap(`<path fill-rule="evenodd" d="m346 360 82-82h126l82 82-82 82H428Zm83-34-34 34 34 34h74l34-34-34-34Z" fill="${ink}" opacity=".16"/><path fill-rule="evenodd" d="m400 482 82-82h126l82 82-82 82H482Zm83-34-34 34 34 34h74l34-34-34-34Z" fill="${ink}" opacity=".12"/><path d="m511 400 34-34 34 34-34 34Z" fill="${ink}" opacity=".19"/>${dots({x:260,y:330,columns:22,rows:18,accept:(x,y)=>x+y>820&&x<490})}`),
  tactics: wrap(`<path d="m600 312-136 136 136 136v-76l-60-60 60-60Z" fill="${ink}" opacity=".17"/><path d="m340 600 136-136-136-136v76l60 60-60 60Z" fill="${ink}" opacity=".12"/><path d="m465 489-40 40 40 40 40-40Z" fill="${ink}" opacity=".2"/>${dots({x:260,y:250,columns:23,rows:24,accept:(x,y)=>x+y>800&&x+y<1000})}`),
  reading: wrap(`<path d="M600 418 418 600h182Z" fill="${ink}" opacity=".07"/><path d="M600 456 456 600h39l105-105Z" fill="${ink}" opacity=".11"/><path d="M600 527 527 600h73Z" fill="${ink}" opacity=".09"/><path d="M600 574h-63v9h63Zm0 18h-81v8h81Z" fill="${ink}" opacity=".14"/>${dots({x:300,y:365,columns:20,rows:16,step:16,square:true,accept:(x,y)=>x+y>920})}`),
  honor: wrap(`<path fill-rule="evenodd" d="m525 220 195 195-195 195-195-195Zm0 76L406 415l119 119 119-119Z" fill="${ink}" opacity=".12"/><path d="m525 354 61 61-61 61-61-61Z" fill="${ink}" opacity=".2"/><path d="m376 491 37 37-71 72h-74Zm54 54 31 31-24 24h-62Z" fill="${ink}" opacity=".14"/>${dots({x:290,y:270,columns:20,rows:23,accept:(x,y)=>x+y>800&&x+y<970})}`),
};
for (const [role,svg] of Object.entries(motifs)) fs.writeFileSync(path.join(directory,`role-${role}.svg`),svg);
fs.writeFileSync(path.join(directory,'role-rank.svg'),motifs.honor.replace('viewBox="0 0 600 600">','viewBox="0 0 600 600"><g transform="translate(600 0) scale(-1 1)">').replace('</svg>','</g></svg>'));
// Preserve the exact solid bands and localized print that the user selected in C.
fs.copyFileSync(path.join(directory,'screenprint.svg'),path.join(directory,'role-inventory.svg'));
