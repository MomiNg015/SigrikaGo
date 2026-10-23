import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

export default defineConfig({
  testDir: ".", testMatch: "modal-scroll.spec.js", workers: 1, timeout: 45000,
  use: { baseURL: "http://127.0.0.1:5298", channel: "msedge", hasTouch: true, isMobile: true },
  webServer: {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    command: "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5298 --strictPort",
    port: 5298, reuseExistingServer: false
  },
  outputDir: "../../.codex-run/modal-scroll-browser"
});
