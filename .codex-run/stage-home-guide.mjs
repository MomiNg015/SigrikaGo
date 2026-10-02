import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYSTEM_DESIGN_SOURCE_PATHS, renderSystemDesignHtml } from '../scripts/render-system-design-html.mjs';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
if (git('diff', '--cached', '--name-only').trim()) throw new Error('Index is not empty');
const files = [
 '.trellis/spec/backend/index.md', '.trellis/spec/backend/home-onboarding-contract.md',
 'prisma/schema.prisma', 'prisma/migrations/20260929090000_home_onboarding',
 'server/index.js', 'server/homeOnboarding.js', 'server/homeOnboarding.test.js',
 'server/onboardingStory.js', 'server/onboardingStory.test.js', 'server/onboardingStoryRoutes.js', 'server/onboardingStoryRoutes.test.js',
 'src/app/App.jsx', 'src/app/useOnboardingStory.js', 'src/home/HomeScreen.jsx',
 'src/home/components/HomeHeader.jsx', 'src/home/components/HomeImageEntries.jsx', 'src/home/components/HomeUtilityDock.jsx', 'src/home/components/PlayerPlaque.jsx',
 'src/home/onboarding', 'src/modals/house/HouseCharacterGrid.jsx', 'src/styles/cssLayerInventory.js',
 'src/styles/mobile-adaptive.css', 'src/styles/mobile-adaptive/home-onboarding.css', 'src/styles/styleContract.test.js',
 'src/tutorial/TutorialBattleScreen.jsx', 'src/tutorial/TutorialBattleScreen.test.jsx', 'src/tutorial/NpcDialogue.jsx', 'src/tutorial/TypewriterText.jsx',
 'tests/e2e/fixtures/home-onboarding-server.mjs', 'tests/e2e/fixtures/home-onboarding.html', 'tests/e2e/fixtures/home-onboarding.jsx',
 'tests/e2e/home-onboarding.config.js', 'tests/e2e/home-onboarding.spec.js'
];
git('add', '--', ...files);
const main = 'docs/system-design.md';
const marker = '## 主界面引导与招新邮件';
const working = readFileSync(main, 'utf8');
if (!working.includes(marker)) throw new Error('Missing home guide docs');
const scopedMain = git('show', `HEAD:${main}`).trimEnd() + '\n\n' + working.slice(working.indexOf(marker)).trimEnd() + '\n';
function stageBlob(path, content) {
 const hash = execFileSync('git', ['hash-object', '-w', '--stdin'], { input: content, encoding: 'utf8' }).trim();
 git('update-index', '--cacheinfo', `100644,${hash},${path}`);
}
stageBlob(main, scopedMain);
const markdown = SYSTEM_DESIGN_SOURCE_PATHS.map(url => {
 const path = relative(process.cwd(), fileURLToPath(url)).replaceAll('\\', '/');
 return git('show', `:${path}`).trim();
}).filter(Boolean).join('\n\n---\n\n') + '\n';
stageBlob('docs/system-design.html', renderSystemDesignHtml(markdown));
console.log(git('diff', '--cached', '--stat'));
