import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const DEV_PROXY_QUIET_SOCKET_ERRORS = new Set(["ECONNRESET", "ECONNREFUSED"]);
const PIXI_OPTIMIZE_DEPS_EXCLUDE = ["pixi.js", "pixi.js/unsafe-eval"];
const PIXI_OPTIMIZE_DEPS_INCLUDE = [
  "pixi.js > @xmldom/xmldom",
  "pixi.js > eventemitter3",
  "pixi.js > gifuct-js",
  "pixi.js > ismobilejs"
];

function isQuietDevProxySocketError(error) {
  return DEV_PROXY_QUIET_SOCKET_ERRORS.has(error?.code);
}

function configureDevSocketProxy(proxy) {
  proxy.on("error", (error) => {
    if (isQuietDevProxySocketError(error)) return;
    console.warn("[vite] websocket proxy error:", error);
  });
}

function configureDevApiProxy(proxy) {
  proxy.on("error", (error, _request, response) => {
    if (!isQuietDevProxySocketError(error) || !response || !("req" in response)
      || response.headersSent || response.writableEnded) return;
    response.writeHead(503, {
      "Content-Type": "application/json; charset=utf-8",
      "Retry-After": "1"
    }).end(JSON.stringify({
      error: "本地后端服务正在启动或重启，请稍后重试。",
      code: "dev_backend_unavailable"
    }));
  });
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: PIXI_OPTIMIZE_DEPS_EXCLUDE,
    include: PIXI_OPTIMIZE_DEPS_INCLUDE
  },
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
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        configure: configureDevApiProxy
      },
      "/uploads": "http://localhost:3001",
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
        configure: configureDevSocketProxy
      }
    }
  }
});

export { configureDevApiProxy, configureDevSocketProxy, isQuietDevProxySocketError };
