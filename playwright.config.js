import { defineConfig, devices } from "@playwright/test";

const clientPort = process.env.E2E_CLIENT_PORT ?? "5317";
const baseURL = `http://127.0.0.1:${clientPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["auth-session.spec.js", "ui-regressions.spec.js", "full-system*.spec.js"],
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  webServer: {
    command: "node scripts/start-e2e-environment.mjs",
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        channel: "chrome"
      }
    }
  ]
});
