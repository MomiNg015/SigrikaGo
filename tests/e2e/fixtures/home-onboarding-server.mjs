import { build, preview } from "vite";
const outDir = ".tmp/playwright-builds/home-onboarding";
await build({ build: { outDir, emptyOutDir: true, rollupOptions: { input: "tests/e2e/fixtures/home-onboarding.html" } } });
const server = await preview({ build: { outDir }, preview: { host: "127.0.0.1", port: 5298, strictPort: true, proxy: {} } });
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => server.httpServer.close(() => process.exit(0)));
