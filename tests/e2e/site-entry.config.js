import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

export default defineConfig({
  testDir: ".",
  testMatch: "site-entry.spec.js",
  outputDir: "../../.codex-run/site-entry-browser-results",
  workers: 1,
  timeout: 45_000,
  use: { baseURL: "http://127.0.0.1:5291", ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, channel: "chrome" },
  webServer: {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    command: "npx vite preview --host 127.0.0.1 --port 5291 --strictPort",
    url: "http://127.0.0.1:5291",
    reuseExistingServer: false
  }
});
