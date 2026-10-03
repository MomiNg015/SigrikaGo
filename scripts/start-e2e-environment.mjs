import { spawn } from "node:child_process";
import path from "node:path";
import { preparePlaywrightTestDatabase } from "./playwrightTestDatabase.mjs";
import { assertTestPortAvailable, stopTestProcesses } from "./stop-test-processes.mjs";
import { e2eClientEnvironment } from "./start-e2e-client.mjs";

const serverPort = process.env.E2E_SERVER_PORT ?? "3317";
const clientPort = process.env.E2E_CLIENT_PORT ?? "5317";
await assertTestPortAvailable(serverPort);
const { cleanup, trackProcess } = await preparePlaywrightTestDatabase({ label: "e2e", port: clientPort, manageSignals: false });
const env = {
  ...process.env,
  NODE_ENV: "stability",
  ENABLE_TEST_ACTIONS: "true",
  ZHIZI_ENABLED: "false",
  UPLOAD_DIR: path.resolve(".tmp", "playwright", `e2e-uploads-${process.env.PLAYWRIGHT_RUN_ID ?? process.pid}`),
  PORT: serverPort,
  JWT_SECRET: "e2e-local-secret-0123456789012345",
  PUBLIC_ORIGIN: `http://127.0.0.1:${clientPort}`
};

const server = spawn(process.execPath, ["server/index.js"], { cwd: process.cwd(), env, stdio: "inherit" });
trackProcess(server);
const vite = spawn(process.execPath, ["scripts/start-e2e-client.mjs"], {
  cwd: process.cwd(),
  env: e2eClientEnvironment(env),
  stdio: "inherit"
});

let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  try {
    await stopTestProcesses([server, vite]);
    cleanup();
    process.exit(code);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

for (const [label, child] of [["API", server], ["Vite", vite]]) {
  child.once("exit", (code, signal) => {
    if (stopping) return;
    console.error(`[e2e] ${label} exited before fixture shutdown: code=${code}, signal=${signal}`);
    void stop(code ?? 1);
  });
  child.once("error", (error) => { console.error(`[e2e] ${label} failed`, error); void stop(1); });
}
for (const [signal, code] of [["SIGINT", 130], ["SIGTERM", 143]]) {
  process.once(signal, () => { console.error(`[e2e] fixture received ${signal}`); void stop(code); });
}
