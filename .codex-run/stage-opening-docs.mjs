import {execFileSync} from 'node:child_process';
import {renderSystemDesignHtml,SYSTEM_DESIGN_SOURCE_PATHS} from '../scripts/render-system-design-html.mjs';
import {fileURLToPath} from 'node:url';
import {relative} from 'node:path';
const parts=SYSTEM_DESIGN_SOURCE_PATHS.map(url=>execFileSync('git',['show',':'+relative(process.cwd(),fileURLToPath(url)).replaceAll('\\','/')],{encoding:'utf8'}).trim());
const html=renderSystemDesignHtml(parts.filter(Boolean).join('\n\n---\n\n')+'\n');
const oid=execFileSync('git',['hash-object','-w','--stdin'],{input:html,encoding:'utf8'}).trim();
execFileSync('git',['update-index','--add','--cacheinfo','100644',oid,'docs/system-design.html']);
console.log('Staged HTML generated from staged Markdown only');
