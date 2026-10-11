import { defineConfig, mergeConfig } from "vite";
import base from "../../vite.config.js";
const config = mergeConfig(base, defineConfig({
  cacheDir: "node_modules/.vite-spectator-presence",
  optimizeDeps: { entries: ["tests/e2e/fixtures/spectator-presence.html"] },
  server: { host: "127.0.0.1", port: 5391, strictPort: true, proxy: {} }
}));

config.server.proxy = {};
export default config;
