import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const DEV_PROXY_QUIET_SOCKET_ERRORS = new Set(["ECONNRESET", "ECONNREFUSED"]);

function isQuietDevProxySocketError(error) {
  return DEV_PROXY_QUIET_SOCKET_ERRORS.has(error?.code);
}

function configureDevSocketProxy(proxy) {
  proxy.on("error", (error) => {
    if (isQuietDevProxySocketError(error)) return;
    console.warn("[vite] websocket proxy error:", error);
  });
}

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll("\\", "/");
          if (!normalizedId.includes("/node_modules/")) return undefined;
          if (normalizedId.includes("/react/") || normalizedId.includes("/react-dom/")) {
            return "react-vendor";
          }
          if (
            normalizedId.includes("/socket.io-client/")
            || normalizedId.includes("/engine.io-client/")
            || normalizedId.includes("/socket.io-parser/")
            || normalizedId.includes("/@socket.io/")
          ) {
            return "realtime-vendor";
          }
          if (normalizedId.includes("/pixi.js/") || normalizedId.includes("/@pixi/")) {
            return "pixi-vendor";
          }
          return undefined;
        }
      }
    }
  },
  server: {
    proxy: {
      "/api": "http://localhost:3001",
      "/uploads": "http://localhost:3001",
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
        configure: configureDevSocketProxy
      }
    }
  }
});

export { configureDevSocketProxy, isQuietDevProxySocketError };
