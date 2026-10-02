import {readFileSync,writeFileSync} from 'node:fs';
const p='.codex-run/stage-paper-runtime.mjs';let s=readFileSync(p,'utf8');s=s.replace("'src/styles/mobile-adaptive/battle-paper-panels.css',","'src/styles/mobile-adaptive/battle-paper-panels.css','src/styles/mobile-adaptive/battle-paper-portrait.css',");writeFileSync('.codex-run/stage-paper-correction.mjs',s);
