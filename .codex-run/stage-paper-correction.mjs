import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {relative} from 'node:path';
import {renderSystemDesignHtml,SYSTEM_DESIGN_SOURCE_PATHS} from '../scripts/render-system-design-html.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'});
if(git('diff','--cached','--name-only').trim())throw Error('Index not empty');
const shared=[['docs/system-design.md',['对弈信息区“立体纸剧场”','对弈 Header 的房间号前缀']],['docs/system-design/06-ui-theme-mobile.md',['`RoomHeader` 的']]];
const staged=new Map();
for(const [path,prefixes] of shared){const current=readFileSync(path,'utf8').split(/\r?\n/);let base=git('show',`HEAD:${path}`).split('\n');for(const prefix of prefixes){const hits=current.filter(l=>l.startsWith(prefix));if(hits.length!==1)throw Error(prefix);base=base.map(l=>l.startsWith(prefix)?hits[0]:l);}staged.set(path,base.join('\n'));}
const merged=SYSTEM_DESIGN_SOURCE_PATHS.map(url=>{const path=relative(process.cwd(),fileURLToPath(url)).replaceAll('\\','/');return(staged.get(path)??git('show',`HEAD:${path}`)).trim();}).filter(Boolean).join('\n\n---\n\n')+'\n';
staged.set('docs/system-design.html',renderSystemDesignHtml(merged));
for(const [path,content]of staged){const hash=execFileSync('git',['hash-object','-w','--stdin'],{input:content,encoding:'utf8'}).trim();git('update-index','--add','--cacheinfo',`100644,${hash},${path}`);}
git('add','--','src/room/PlayerInfo.jsx','src/room/PlayerInfo.test.js','src/styles/mobile-adaptive.css','src/styles/mobile-adaptive/battle-paper-panels.css','src/styles/mobile-adaptive/battle-paper-portrait.css','src/styles/mobile-adaptive/battle-paper-panels-mobile.css','src/styles/room/players-timers-skills/player-card.css','DESIGN.md','.impeccable/design.json','.trellis/tasks/09-29-battle-paper-stage/prd.md','.trellis/tasks/09-29-battle-paper-stage/task.json');
console.log(git('diff','--cached','--stat'));
