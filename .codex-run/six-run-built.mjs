import {build,preview} from 'vite';
await build({build:{outDir:'.codex-run/six-dist',rollupOptions:{input:['index.html','.codex-run/audit-a.html','.codex-run/beauty-b.html','.codex-run/beauty-b-extra.html']}}});
const server=await preview({build:{outDir:'.codex-run/six-dist'},preview:{host:'127.0.0.1',port:5178,strictPort:true}});
try{await import('./six-verify.mjs');process.exit(0);}catch(e){console.error(e);process.exit(1);}finally{server.httpServer.close();}
