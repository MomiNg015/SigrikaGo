import {spawn} from 'node:child_process';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5177'],{stdio:'inherit'});
try {await new Promise(r=>setTimeout(r,2000));await import('./six-verify.mjs');}finally{server.kill();}
