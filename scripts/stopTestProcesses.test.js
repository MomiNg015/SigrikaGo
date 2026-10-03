import { spawn } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";
import { assertTestPortAvailable, stopTestProcesses } from "./stop-test-processes.mjs";
import { cleanupPlaywrightTestDatabase } from "./playwrightTestDatabase.mjs";

test("test service shutdown resolves only after the real child exits, including a forced shutdown", async () => {
  const child = spawn(process.execPath, ["-e", 'const net = require("node:net"); process.on("SIGTERM", () => {}); const server = net.createServer(); server.listen(0, "127.0.0.1", () => process.stdout.write(String(server.address().port)));'],
    { stdio: ["ignore", "pipe", "ignore"] });
  const databasePath = path.resolve(".tmp/playwright", `shutdown-${randomUUID()}.db`);
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  try {
    const [portData] = await once(child.stdout, "data");
    const port = Number(portData.toString());
    await expect(assertTestPortAvailable(port)).rejects.toMatchObject({ code: "EADDRINUSE" });
    fs.writeFileSync(databasePath, "disposable test data");
    fs.writeFileSync(`${databasePath}.pid`, String(child.pid));
    expect(() => cleanupPlaywrightTestDatabase({ databasePath })).toThrow("still owned");
    expect(fs.existsSync(databasePath)).toBe(true);
    await stopTestProcesses([child], { graceMs: 50, forceMs: 2000 });
    expect(child.exitCode !== null || child.signalCode !== null).toBe(true);
    await stopTestProcesses([child]);
    await assertTestPortAvailable(port);
    cleanupPlaywrightTestDatabase({ databasePath });
    expect(fs.existsSync(databasePath)).toBe(false);
    expect(fs.existsSync(`${databasePath}.pid`)).toBe(false);
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  }
});
