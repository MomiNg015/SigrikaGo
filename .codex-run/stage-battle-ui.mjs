import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {relative} from 'node:path';
import {renderSystemDesignHtml,SYSTEM_DESIGN_SOURCE_PATHS} from '../scripts/render-system-design-html.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'});
if(git('diff','--cached','--name-only').trim()) throw new Error('Index is not empty');
const shared=[
 ['docs/system-design.md',['对弈 Header 的房间号前缀','常规对弈功能区固定保留']],
 ['docs/system-design/06-ui-theme-mobile.md',['`RoomHeader` 的 `.room-code-label`','常规玩家 `ActionBar` 固定呈现']],
 ['.trellis/spec/frontend/quality-guidelines.md',['- Ordinary Bright School room player cards','- Ordinary player `ActionBar` retains']]
];
const staged=new Map();
for(const [path,prefixes] of shared){
 const base=git('show',`HEAD:${path}`);
 const lines=readFileSync(path,'utf8').split(/\r?\n/);
 const additions=prefixes.map(prefix=>{const hits=lines.filter(l=>l.startsWith(prefix));if(hits.length!==1)throw new Error(`Ambiguous paragraph ${prefix}`);return hits[0]}).join('\n\n');
 const firstNewline=base.indexOf('\n');
 staged.set(path,base.slice(0,firstNewline+1)+'\n'+additions+'\n'+base.slice(firstNewline+1));
}
const merged=SYSTEM_DESIGN_SOURCE_PATHS.map(url=>{
 const path=relative(process.cwd(),fileURLToPath(url)).replaceAll('\\','/');
 return (staged.get(path)??git('show',`HEAD:${path}`)).trim();
}).filter(Boolean).join('\n\n---\n\n')+'\n';
staged.set('docs/system-design.html',renderSystemDesignHtml(merged));
for(const [path,content] of staged){
 const hash=execFileSync('git',['hash-object','-w','--stdin'],{input:content,encoding:'utf8'}).trim();
 git('update-index','--add','--cacheinfo',`100644,${hash},${path}`);
}
git('add','--','src/room/ActionBar.jsx','src/room/ActionBar.test.js','src/styles/room/people-floating-replay.css','src/room/header/RoomHeader.jsx','src/room/header/RoomHeader.test.jsx','src/room/RoomScreen.test.js','src/styles/themes/bright-school/room/player-status.css','.trellis/tasks/09-29-battle-controls-player-shadow');
console.log(git('diff','--cached','--stat'));
