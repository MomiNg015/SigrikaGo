import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

export default defineConfig({
  testDir: ".", testMatch: ["window-surfaces.spec.js", "friends-companion.spec.js", "profile-paper.spec.js", "entry-surfaces.spec.js", "battle-presentation.spec.js", "warehouse-team-match.spec.js", "warehouse-paper.spec.js", "watch-paper.spec.js", "typography.spec.js", "text-readability.spec.js", "font-size-readability.spec.js"], workers: 1, timeout: 45000,
  use: { baseURL: "http://127.0.0.1:5297", channel: "msedge" },
  webServer: {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    command: "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5297 --strictPort",
    port: 5297, reuseExistingServer: false
  },
  outputDir: "../../.codex-run/window-surfaces-browser"
});
