import { spawn } from "node:child_process";
import path from "node:path";
import { build, createServer, preview } from "vite";
import { preparePlaywrightTestDatabase } from "../../../scripts/playwrightTestDatabase.mjs";
import { assertTestPortAvailable, stopTestProcesses } from "../../../scripts/stop-test-processes.mjs";
import { CONTENT_SECURITY_POLICY_DIRECTIVES } from "../../../server/securityHeaders.js";

const port = Number(process.env.LOCAL_PRACTICE_TEST_PORT ?? 5293);
const apiPort = Number(process.env.LOCAL_PRACTICE_API_PORT ?? 3293);
await assertTestPortAvailable(apiPort);
const { cleanup, trackProcess } = await preparePlaywrightTestDatabase({ label: "local-practice", port, manageSignals: false });
const api = spawn(process.execPath, ["server/index.js"], {
  env: { ...process.env, NODE_ENV: "test", PORT: String(apiPort), ZHIZI_ENABLED: "false",
    UPLOAD_DIR: path.resolve(".tmp/playwright", `practice-uploads-${port}-${process.env.PLAYWRIGHT_RUN_ID ?? process.pid}`),
    JWT_SECRET: "e2e-local-secret-0123456789012345", PUBLIC_ORIGIN: `http://127.0.0.1:${port}` },
  stdio: "inherit"
});
trackProcess(api);
const outDir = ".tmp/playwright-builds/local-practice";
let server;
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  try {
    if (server?.close) await server.close();
    else if (server?.httpServer) await new Promise((resolve) => server.httpServer.close(resolve));
    await stopTestProcesses([api]);
    cleanup();
    process.exit(code);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => void stop());
api.once("exit", (code) => { if (!stopping) void stop(code || 1); });
api.once("error", () => void stop(1));
try {
// The fixture owns shutdown; EOF from an automation parent must not stop Vite.
process.env.CI = "true";
const development = process.env.LOCAL_PRACTICE_TEST_MODE === "development";
if (!development) await build({ build: { outDir, rollupOptions: { input: "tests/e2e/fixtures/local-practice.html" } } });
const csp = Object.entries(CONTENT_SECURITY_POLICY_DIRECTIVES)
  .filter(([name]) => name !== "upgradeInsecureRequests")
  .map(([name, values]) => `${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)} ${values.join(" ")}`).join("; ");
const serving = {
  host: "127.0.0.1", port, strictPort: true,
  watch: { ignored: ["**/.codex-run/**", "**/.tmp/**", "**/.worktrees/**"] },
  headers: { "Content-Security-Policy": csp },
  proxy: { "/api": `http://127.0.0.1:${apiPort}`, "/uploads": `http://127.0.0.1:${apiPort}`,
    "/socket.io": { target: `http://127.0.0.1:${apiPort}`, ws: true } }
};
server = development
  ? await createServer({ server: serving, cacheDir: `node_modules/.vite-practice-${port}`,
    optimizeDeps: { entries: ["tests/e2e/fixtures/local-practice.html"] } })
  : await preview({ build: { outDir }, preview: serving });
if (development) await server.listen();
} catch (error) {
  console.error(error);
  await stop(1);
}
