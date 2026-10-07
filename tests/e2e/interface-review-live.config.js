import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import base from "../../playwright.config.js";

export default defineConfig({
  ...base, testDir: ".", testMatch: "interface-review-live.spec.js",
  webServer: { ...base.webServer, cwd: fileURLToPath(new URL("../../", import.meta.url)) }
});
