import { defineConfig, devices } from "@playwright/test";

const stabilityPort = process.env.STABILITY_PORT ?? process.env.PORT ?? "4173";
const stabilityBaseURL = `http://127.0.0.1:${stabilityPort}`;

export default defineConfig({
  testDir: "./tests/stability",
  timeout: 60_000,
  workers: 1,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: stabilityBaseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "node scripts/start-stability-server.mjs",
    url: stabilityBaseURL,
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome"
      }
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
        channel: "chrome"
      }
    }
  ]
});
