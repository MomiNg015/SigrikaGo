import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

const port = process.env.LOCAL_PRACTICE_TEST_PORT ?? "5293";
const baseURL = `http://127.0.0.1:${port}`;
const devPort = Number(port) + 1;
const devBaseURL = `http://127.0.0.1:${devPort}`;
export default defineConfig({
  testDir: ".", testMatch: "local-practice.spec.js", workers: 2, timeout: 90_000,
  expect: { timeout: 30_000 },
  use: { baseURL, ...devices["Desktop Chrome"], channel: "chrome" },
  projects: [
    { name: "production", use: { baseURL } },
    { name: "development", use: { baseURL: devBaseURL } }
  ],
  webServer: [{
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    command: "node tests/e2e/fixtures/local-practice-server.mjs",
    url: `${baseURL}/tests/e2e/fixtures/local-practice.html`,
    timeout: 120_000, reuseExistingServer: false
  }, {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    command: "node tests/e2e/fixtures/local-practice-server.mjs",
    env: { LOCAL_PRACTICE_TEST_MODE: "development", LOCAL_PRACTICE_TEST_PORT: String(devPort),
      LOCAL_PRACTICE_API_PORT: String(Number(process.env.LOCAL_PRACTICE_API_PORT ?? 3293) + 1) },
    url: `${devBaseURL}/tests/e2e/fixtures/local-practice.html`,
    timeout: 120_000, reuseExistingServer: false
  }]
});
