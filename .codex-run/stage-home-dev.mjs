import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYSTEM_DESIGN_SOURCE_PATHS, renderSystemDesignHtml } from '../scripts/render-system-design-html.mjs';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
if (git('diff', '--cached', '--name-only').trim()) throw new Error('Index is not empty');
const files = ['.trellis/spec/backend/home-onboarding-contract.md','src/home/onboarding/useHomeOnboarding.js','src/home/onboarding/useHomeOnboarding.dom.test.jsx'];
git('add', '--', ...files);
const main = 'docs/system-design.md';
const marker = '开发环境（Vite `import.meta.env.DEV`）';
const working = readFileSync(main, 'utf8');
if (!working.includes(marker)) throw new Error('Missing home guide docs');
const scopedMain = git('show', `HEAD:${main}`).trimEnd() + '\n\n' + working.slice(working.indexOf(marker)).trimEnd() + '\n';
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
