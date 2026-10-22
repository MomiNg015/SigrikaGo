import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

export default defineConfig({
  testDir: ".",
  testMatch: ["spectator-presence.spec.js", "battle-presentation.spec.js"],
  outputDir: "../../.codex-run/battle-presence/playwright",
  workers: 1,
  timeout: 30000,
  use: { baseURL: "http://127.0.0.1:5391", channel: "chrome", trace: "retain-on-failure" },
  webServer: {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    command: "npx vite --config tests/e2e/spectator-presence.vite.js",
    url: "http://127.0.0.1:5391/tests/e2e/fixtures/spectator-presence.html",
    reuseExistingServer: true
  }
});
