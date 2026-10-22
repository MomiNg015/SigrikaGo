import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

export default defineConfig({
  testDir: ".", testMatch: "card-screenprints.spec.js", workers: 1, timeout: 30000,
  use: { baseURL: "http://127.0.0.1:5301", channel: "msedge", reducedMotion: "reduce" },
  webServer: {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    command: "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5301 --strictPort",
    port: 5301, reuseExistingServer: false
  },
  outputDir: "../../.codex-run/card-screenprints-browser"
});
