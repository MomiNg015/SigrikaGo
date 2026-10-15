import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {SYSTEM_DESIGN_SOURCE_PATHS,renderSystemDesignHtml} from '../../../scripts/render-system-design-html.mjs';
const base='.trellis/tasks/10-14-mobile-profile-readability/commit/';
const parts=[];
for(const url of SYSTEM_DESIGN_SOURCE_PATHS){
  const path='docs/'+url.pathname.split('/docs/')[1];
  let text;
  try{text=await readFile(base+path,'utf8');}catch{text=execFileSync('git',['show','HEAD:'+path],{encoding:'utf8'});}
  parts.push(text.trim());
}
await writeFile(base+'docs/system-design.html',renderSystemDesignHtml(parts.filter(Boolean).join('\n\n---\n\n')+'\n'));
