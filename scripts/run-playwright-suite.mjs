import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { cleanupPlaywrightTestDatabase } from "./playwrightTestDatabase.mjs";

const suites = {
  e2e: {
    label: "e2e",
    port: process.env.E2E_CLIENT_PORT ?? "5173",
    configArgs: []
  },
  stability: {
    label: "stability",
    port: process.env.STABILITY_PORT ?? process.env.PORT ?? "4173",
    configArgs: ["-c", "playwright.stability.config.js"]
  }
};

const suiteName = process.argv[2];
const suite = suites[suiteName];
if (!suite) {
  throw new Error(`Unknown Playwright suite: ${suiteName ?? ""}`);
}

const runId = randomUUID();
const extraPlaywrightArgs = process.argv.slice(3);
const result = spawnSync(
  process.execPath,
  [
    path.resolve("node_modules", "@playwright", "test", "cli.js"),
    "test",
    ...suite.configArgs,
    ...extraPlaywrightArgs
  ],
  {
    cwd: process.cwd(),
    env: { ...process.env, PLAYWRIGHT_RUN_ID: runId },
    stdio: "inherit"
  }
);

cleanupPlaywrightTestDatabase({
  label: suite.label,
  port: suite.port,
  runId
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
