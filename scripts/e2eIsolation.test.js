import { expect, test } from "vitest";
import { spawn } from "node:child_process";
import net from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { e2eClientConfig, e2eClientEnvironment } from "./start-e2e-client.mjs";
import { stopTestProcesses } from "./stop-test-processes.mjs";

test("E2E HTTP, uploads and sockets target the disposable server at a custom port", () => {
  const { server, cacheDir, optimizeDeps } = e2eClientConfig({ E2E_SERVER_PORT: "3197", E2E_CLIENT_PORT: "5197" });
  expect(server.port).toBe(5197);
  expect(server.strictPort).toBe(true);
  expect(cacheDir).toBe("node_modules/.vite-e2e-5197");
  expect(optimizeDeps.entries).toEqual(["index.html"]);
  expect(server.proxy).toEqual({
    "/api": "http://127.0.0.1:3197",
    "/uploads": "http://127.0.0.1:3197",
    "/socket.io": { target: "http://127.0.0.1:3197", ws: true }
  });
});

test("default E2E ports avoid the user's 3001/5173 development services", () => {
  const { server } = e2eClientConfig({});
  expect(server.port).toBe(5317);
  expect(server.proxy["/api"]).toBe("http://127.0.0.1:3317");
});

test("closing the automation stdin keeps the real Vite test service available", async () => {
  const probe = net.createServer();
  await new Promise(resolve => probe.listen(0, "127.0.0.1", resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const child = spawn(process.execPath, ["--import", "data:text/javascript,process.stdin.resume()", "scripts/start-e2e-client.mjs"], {
    env: e2eClientEnvironment({ ...process.env, E2E_CLIENT_PORT: String(port) }),
    stdio: ["pipe", "ignore", "ignore"]
  });
  const url = `http://127.0.0.1:${port}`;
  try {
    await expect.poll(async () => {
      try { return (await fetch(url, { signal: AbortSignal.timeout(500) })).status; } catch { return 0; }
    }, { timeout: 15_000, interval: 100 }).toBe(200);
    child.stdin.end();
    await delay(300);
    expect(child.exitCode).toBeNull();
    expect((await fetch(url, { signal: AbortSignal.timeout(2000) })).status).toBe(200);
  } finally {
    await stopTestProcesses([child], { graceMs: 3000, forceMs: 2000 });
  }
}, 25_000);
