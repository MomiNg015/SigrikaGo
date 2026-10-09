import { pathToFileURL } from 'node:url';
import path from 'node:path';
const { default: config } = await import(pathToFileURL(path.resolve('tests/e2e/team-match.config.js')).href);
export default {...config,testDir:path.resolve('tests/e2e'),webServer:{...config.webServer,reuseExistingServer:true}};
