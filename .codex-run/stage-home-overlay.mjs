import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYSTEM_DESIGN_SOURCE_PATHS, renderSystemDesignHtml } from '../scripts/render-system-design-html.mjs';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });

const files = ['.trellis/spec/backend/home-onboarding-contract.md','src/home/onboarding/HomeOnboarding.jsx','src/home/onboarding/HomeOnboarding.dom.test.jsx','src/styles/mobile-adaptive/home-onboarding.css','src/styles/cssLayerInventory.js','tests/e2e/home-onboarding.spec.js'];
git('add', '--', ...files);
const main = 'docs/system-design.md';
const marker = '主界面引导聊天框为纯覆盖层：';
const working = readFileSync(main, 'utf8');
if (!working.includes(marker)) throw new Error('Missing home guide docs');
const scopedMain = git('show', `HEAD:${main}`).replace('聊天框与窗口预留空间。', '聊天框仅作为顶层浮动覆盖。').replace('真实窗口为上方台词预留空间。', '不为聊天框修改真实窗口的位置、尺寸或排版。').trimEnd() + '\n\n' + working.slice(working.indexOf(marker)).trimEnd() + '\n';
function stageBlob(path, content) {
 const hash = execFileSync('git', ['hash-object', '-w', '--stdin'], { input: content.replaceAll('\r\n', '\n'), encoding: 'utf8' }).trim();
 git('update-index', '--cacheinfo', `100644,${hash},${path}`);
}
stageBlob(main, scopedMain);
const markdown = SYSTEM_DESIGN_SOURCE_PATHS.map(url => {
 const path = relative(process.cwd(), fileURLToPath(url)).replaceAll('\\', '/');
 return git('show', `:${path}`).trim();
}).filter(Boolean).join('\n\n---\n\n') + '\n';
stageBlob('docs/system-design.html', renderSystemDesignHtml(markdown));
console.log(git('diff', '--cached', '--stat'));
