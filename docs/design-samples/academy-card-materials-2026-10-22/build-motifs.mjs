import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const directory=path.dirname(fileURLToPath(import.meta.url));
const emblem=fs.readFileSync(path.resolve(directory,'../../../public/assets/factions/startorch.webp')).toString('base64');
const imprint=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 600 600"><defs><filter id="ink" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .25 0 0 0 0 .28 0 0 0 0 .26 0 0 0 .21 0"/></filter></defs><path d="M600 0H498L298 600H600Z" fill="#68746c" opacity=".065"/><image x="228" y="72" width="455" height="400" xlink:href="data:image/webp;base64,${emblem}" filter="url(#ink)"/><path d="M538 490h62v22h-62zm-42 0h22v22h-22zm42 40h62v12h-62" fill="#68746c" opacity=".13"/></svg>`;
let dots='';
for(let row=0;row<36;row++)for(let col=0;col<32;col++){
  const x=208+col*13,y=104+row*13;
  if(x+y<640||x>600||y>600)continue;
  const radius=Math.min(3.5,Math.max(.5,(x+y-620)/160));
  dots+=`<circle cx="${x}" cy="${y}" r="${radius.toFixed(2)}"/>`;
}
const screenprint=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><path d="M600 258 258 600h103l239-239Zm0 158L416 600h59l125-125Z" fill="#606962" opacity=".17"/><path d="m600 0-94 94v184l94-94Z" fill="#8a9687" opacity=".15"/><g fill="#58665d" opacity=".18">${dots}</g><path d="M426 518h56v21h-56zm71 0h21v21h-21zm36 0h67v21h-67" fill="#68746c" opacity=".26"/><path d="M539 337h61v58h-61Z" fill="#fffaf0"/></svg>`;
fs.writeFileSync(path.join(directory,'imprint.svg'),imprint);
fs.writeFileSync(path.join(directory,'screenprint.svg'),screenprint);
