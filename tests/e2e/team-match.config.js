import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

const port = process.env.TEAM_VISUAL_PORT ?? "5290";
const baseURL = `http://127.0.0.1:${port}`;

// Component browser checks need neither accounts nor a live game database.
export default defineConfig({
  testDir: ".",
  testMatch: "team-match.spec.js",
  timeout: 30_000,
  workers: 1,
  use: { baseURL, ...devices["Desktop Chrome"], channel: "chrome" },
  webServer: {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    command: "node tests/e2e/fixtures/team-match-server.mjs",
    url: `${baseURL}/tests/e2e/fixtures/team-match.html`,
    timeout: 120_000,
    reuseExistingServer: false
  }
});
