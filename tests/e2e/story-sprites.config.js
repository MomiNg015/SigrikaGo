import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

export default defineConfig({
  testDir: ".",
  testMatch: "story-sprites.spec.js",
  timeout: 60000,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:5374", browserName: "chromium", channel: "chrome", reducedMotion: "reduce" },
  webServer: {
    command: "node tests/e2e/fixtures/story-sprites-server.mjs",
    cwd: fileURLToPath(new URL("../..", import.meta.url)),
    url: "http://127.0.0.1:5374/tests/e2e/fixtures/story-sprites.html",
    reuseExistingServer: false,
    timeout: 120000
  }
});
