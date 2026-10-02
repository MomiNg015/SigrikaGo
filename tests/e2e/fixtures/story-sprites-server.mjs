import { build, preview } from "vite";
import viteConfig from "../../../vite.config.js";

const outDir = ".tmp/playwright-builds/story-sprites";
await build({
  ...viteConfig,
  configFile: false,
  build: { ...viteConfig.build, outDir, emptyOutDir: true, rollupOptions: { ...viteConfig.build.rollupOptions, input: "tests/e2e/fixtures/story-sprites.html" } }
});
const server = await preview({
  configFile: false,
  build: { outDir },
  preview: { host: "127.0.0.1", port: 5374, strictPort: true, proxy: {} }
});
server.printUrls();
process.stdin.resume();
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => server.httpServer.close(() => process.exit(0)));
