import {ESLint} from 'eslint';
import config from '../eslint.config.js';
const files=['src/modals/gameLifecycle/OpeningDuelPresentation.jsx','src/modals/gameLifecycle/OpeningModal.jsx','src/modals/gameLifecycle/OpeningDuelPresentation.dom.test.jsx','src/app/socketHandlers.js','src/app/socketHandlers.test.js','src/room/RoomScreen.jsx'];
const lint=new ESLint({overrideConfig:[{...config[1],files}]});
const results=await lint.lintFiles(files);
console.log((await lint.loadFormatter('stylish')).format(results));
process.exitCode=results.some(r=>r.errorCount||r.warningCount)?1:0;
