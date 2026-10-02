import { spawn } from "node:child_process";
import path from "node:path";
import { preparePlaywrightTestDatabase } from "./playwrightTestDatabase.mjs";

const serverPort = process.env.E2E_SERVER_PORT ?? "3001";
const clientPort = process.env.E2E_CLIENT_PORT ?? "5173";
const { cleanup } = await preparePlaywrightTestDatabase({ label: "e2e", port: clientPort });
const env = {
  ...process.env,
  NODE_ENV: "test",
  PORT: serverPort,
  JWT_SECRET: "e2e-local-secret-0123456789012345",
  PUBLIC_ORIGIN: `http://127.0.0.1:${clientPort}`
};

const server = spawn(process.execPath, ["server/index.js"], { cwd: process.cwd(), env, stdio: "inherit" });
const vite = spawn(process.execPath, [path.resolve("node_modules", "vite", "bin", "vite.js"), "--host", "0.0.0.0", "--port", clientPort], {
  cwd: process.cwd(),
  env,
  stdio: "inherit"
});

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  server.kill();
  vite.kill();
  cleanup();
  process.exit(code);
}

server.once("exit", (code) => stop(code ?? 1));
vite.once("exit", (code) => stop(code ?? 1));
process.once("SIGINT", () => stop(130));
process.once("SIGTERM", () => stop(143));
