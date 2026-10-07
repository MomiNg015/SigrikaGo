import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

const port = process.env.INTERFACE_VISUAL_PORT ?? "5305";
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: ".", testMatch: "interface-polish.spec.js", timeout: 30_000, workers: 1,
  use: { baseURL, ...devices["Desktop Chrome"], channel: "chrome" },
  webServer: {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    command: `npx vite --host 127.0.0.1 --port ${port} --strictPort`,
    url: `${baseURL}/tests/e2e/fixtures/interface-polish.html`, timeout: 120_000, reuseExistingServer: true
  }
});
