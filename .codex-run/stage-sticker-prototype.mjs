import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {relative} from 'node:path';
import {renderSystemDesignHtml,SYSTEM_DESIGN_SOURCE_PATHS} from '../scripts/render-system-design-html.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'});
if(git('diff','--cached','--name-only').trim()) throw Error('Index not empty');
const paragraph=readFileSync('docs/system-design.md','utf8').split(/\r?\n/).find(line=>line.startsWith('移动端纸贴棋钟独立样板'));
if(!paragraph) throw Error('Missing prototype documentation');
const staged=new Map([['docs/system-design.md',git('show','HEAD:docs/system-design.md').replace('# SigrikaGo 系统设计',`# SigrikaGo 系统设计\n\n${paragraph}`)]]);
const merged=SYSTEM_DESIGN_SOURCE_PATHS.map(url=>{const path=relative(process.cwd(),fileURLToPath(url)).replaceAll('\\','/');return(staged.get(path)??git('show',`HEAD:${path}`)).trim();}).filter(Boolean).join('\n\n---\n\n')+'\n';
staged.set('docs/system-design.html',renderSystemDesignHtml(merged));
for(const [path,content]of staged){const hash=execFileSync('git',['hash-object','-w','--stdin'],{input:content,encoding:'utf8'}).trim();git('update-index','--add','--cacheinfo',`100644,${hash},${path}`);}
git('add','--','.trellis/tasks/09-29-battle-paper-stage/prd.md');
git('add','-f','--',...['html','css','js'].map(ext=>`docs/prototypes/battle-sticker-clock.${ext}`),...['identity','counter','overclock','skill'].map(name=>`docs/prototypes/assets/battle-stickers/${name}.png`));
console.log(git('diff','--cached','--stat'));
