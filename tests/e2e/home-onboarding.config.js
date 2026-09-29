import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
export default defineConfig({
  testDir: ".", testMatch: "home-onboarding.spec.js", workers: 1, timeout: 90_000,
  use: { baseURL: "http://127.0.0.1:5298", channel: "chrome", reducedMotion: "reduce" },
  webServer: { cwd: fileURLToPath(new URL("../../", import.meta.url)), command: "node tests/e2e/fixtures/home-onboarding-server.mjs", port: 5298, timeout: 120000, reuseExistingServer: false },
  outputDir: "../../.codex-run/home-onboarding-browser"
});
