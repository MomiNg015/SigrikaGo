import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
export default defineConfig({
  testDir: ".", testMatch: "handbook-puzzle.spec.js", workers: 1, timeout: 60000,
  use: { baseURL: "http://127.0.0.1:5297", channel: "chrome" },
  webServer: { cwd: fileURLToPath(new URL("../../", import.meta.url)),
    command: "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5297 --strictPort",
    port: 5297, reuseExistingServer: false },
  outputDir: "../../.codex-run/handbook-puzzle-browser"
});
