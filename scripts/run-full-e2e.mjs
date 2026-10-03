import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { cleanupPlaywrightTestDatabase } from "./playwrightTestDatabase.mjs";

const configurations = {
  application: "playwright.config.js",
  "site-entry": "tests/e2e/site-entry.config.js",
  "home-onboarding": "tests/e2e/home-onboarding.config.js",
  "team-match": "tests/e2e/team-match.config.js",
  "local-practice": "tests/e2e/local-practice.config.js"
};
const args = process.argv.slice(2);
const skipBuild = args.includes("--skip-build");
const selected = args.filter((arg) => arg !== "--skip-build");
const suites = selected.length ? selected : Object.keys(configurations);
if (suites.some((suite) => !configurations[suite])) throw new Error("Unknown E2E suite");
if (!skipBuild) {
  const build = spawnSync(process.execPath, [path.resolve("node_modules/vite/bin/vite.js"), "build"], { stdio: "inherit" });
  if (build.status !== 0) process.exit(build.status ?? 1);
} else if (!fs.existsSync("dist/index.html")) throw new Error("--skip-build requires a current dist/index.html");

const failures = [];
const output = path.resolve(".tmp/e2e-all", new Date().toISOString().replaceAll(":", "-"));
for (const suite of suites) {
  const runId = randomUUID();
  console.log(`\nRunning ${suite} with one browser worker`);
  try {
    const result = spawnSync(process.execPath, [path.resolve("node_modules/@playwright/test/cli.js"),
      "test", "--config", configurations[suite], "--workers=1", `--output=${path.join(output, suite)}`], {
      env: { ...process.env, PLAYWRIGHT_RUN_ID: runId }, stdio: "inherit"
    });
    if (result.error) throw result.error;
    if (result.status !== 0) failures.push(suite);
  } finally {
    const databases = suite === "application"
      ? [{ label: "e2e", port: process.env.E2E_CLIENT_PORT ?? "5317" }]
      : suite === "local-practice" ? [0, 1].map((offset) => ({ label: "local-practice",
        port: Number(process.env.LOCAL_PRACTICE_TEST_PORT ?? 5293) + offset })) : [];
    for (const database of databases) cleanupPlaywrightTestDatabase({ ...database, runId });
  }
}
console.log(JSON.stringify({ suites, failed: failures, output }, null, 2));
process.exit(failures.length ? 1 : 0);
