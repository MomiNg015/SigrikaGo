import { spawn } from "node:child_process";
import { build, createServer, preview } from "vite";
import { preparePlaywrightTestDatabase } from "../../../scripts/playwrightTestDatabase.mjs";
import { CONTENT_SECURITY_POLICY_DIRECTIVES } from "../../../server/securityHeaders.js";

const port = Number(process.env.LOCAL_PRACTICE_TEST_PORT ?? 5293);
const apiPort = Number(process.env.LOCAL_PRACTICE_API_PORT ?? 3293);
const { cleanup } = await preparePlaywrightTestDatabase({ label: "local-practice", port });
const api = spawn(process.execPath, ["server/index.js"], {
  env: { ...process.env, NODE_ENV: "test", PORT: String(apiPort), JWT_SECRET: "e2e-local-secret-0123456789012345", PUBLIC_ORIGIN: `http://127.0.0.1:${port}` },
  stdio: "inherit"
});
const outDir = ".codex-run/local-practice-e2e-dist";
const development = process.env.LOCAL_PRACTICE_TEST_MODE === "development";
if (!development) await build({ build: { outDir, rollupOptions: { input: "tests/e2e/fixtures/local-practice.html" } } });
const csp = Object.entries(CONTENT_SECURITY_POLICY_DIRECTIVES)
  .filter(([name]) => name !== "upgradeInsecureRequests")
  .map(([name, values]) => `${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)} ${values.join(" ")}`).join("; ");
const serving = {
  host: "127.0.0.1", port, strictPort: true,
  watch: { ignored: ["**/.codex-run/**", "**/.tmp/**", "**/.worktrees/**"] },
  headers: { "Content-Security-Policy": csp },
  proxy: { "/api": `http://127.0.0.1:${apiPort}`, "/socket.io": { target: `http://127.0.0.1:${apiPort}`, ws: true } }
};
const server = development
  ? await createServer({ server: serving, cacheDir: ".codex-run/local-practice-vite-cache",
    optimizeDeps: { entries: ["tests/e2e/fixtures/local-practice.html"] } })
  : await preview({ build: { outDir }, preview: serving });
if (development) await server.listen();
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => { api.kill(); server.httpServer.close(); cleanup(); process.exit(0); });
}
