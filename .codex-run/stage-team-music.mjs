import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import { renderSystemDesignHtml, SYSTEM_DESIGN_SOURCE_PATHS } from '../scripts/render-system-design-html.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'});
if(git('diff','--cached','--name-only').trim()) throw new Error('Index already contains changes');
const note='队际赛背景音乐从技能发生时的阶段阵容解析角色，换轮不再用新角色重解释旧技能；换轮前的曲目持续播放，直到新的技能或终局按既有规则切换，重连亦可从棋谱历史恢复。';
const markdown=git('show','HEAD:docs/system-design.md').replaceAll('\r\n','\n').replace('# SigrikaGo 系统设计\n','# SigrikaGo 系统设计\n\n'+note+'\n');
function stage(path,content){const hash=execFileSync('git',['hash-object','-w','--stdin'],{input:content,encoding:'utf8'}).trim();git('update-index','--add','--cacheinfo',`100644,${hash},${path}`);}
git('add','--','src/shared/musicLibrary.js','src/app/useBackgroundMusicTrack.test.js');
stage('docs/system-design.md',markdown);
const combined=SYSTEM_DESIGN_SOURCE_PATHS.map(url=>git('show',':'+relative(process.cwd(),fileURLToPath(url)).replaceAll('\\','/')).trim()).filter(Boolean).join('\n\n---\n\n')+'\n';
stage('docs/system-design.html',renderSystemDesignHtml(combined));
writeFileSync('.codex-run/team-music-staged-files.txt',git('diff','--cached','--stat'));
