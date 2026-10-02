import { describe, expect, test } from "vitest";
import { EventEmitter } from "node:events";
import config, { configureDevSocketProxy, isQuietDevProxySocketError } from "../vite.config.js";

describe("vite build config", () => {
  const manualChunks = config.build.rollupOptions.output.manualChunks;

  test("keeps known runtime libraries in explicit chunks", () => {
    expect(manualChunks("C:/repo/node_modules/react/index.js")).toBe("react-vendor");
    expect(manualChunks("C:/repo/node_modules/react-dom/client.js")).toBe("react-vendor");
    expect(manualChunks("C:/repo/node_modules/socket.io-client/build/esm/index.js")).toBe("realtime-vendor");
    expect(manualChunks("C:/repo/node_modules/pixi.js/lib/index.mjs")).toBe("pixi-vendor");
  });

  test("does not create a catch-all vendor chunk that can form circular chunks", () => {
    expect(manualChunks("C:/repo/node_modules/lucide-react/dist/esm/icons.js")).toBeUndefined();
  });

  test("allows the lazy Pixi chunk while keeping entry chunks below the default warning target", () => {
    expect(config.build.chunkSizeWarningLimit).toBe(900);
  });

  test("keeps Pixi renderer modules out of Vite dev dependency optimization", () => {
    expect(config.optimizeDeps?.exclude).toEqual(expect.arrayContaining([
      "pixi.js",
      "pixi.js/unsafe-eval"
    ]));
    expect(config.optimizeDeps?.include).toEqual(expect.arrayContaining([
      "pixi.js > @xmldom/xmldom",
      "pixi.js > eventemitter3",
      "pixi.js > gifuct-js",
      "pixi.js > ismobilejs"
    ]));
  });

  test("keeps expected websocket proxy disconnects quiet during dev server restarts", () => {
    const proxy = new EventEmitter();
    const originalWarn = console.warn;
    const warnings = [];
    console.warn = (...args) => warnings.push(args);

    try {
      configureDevSocketProxy(proxy);
      proxy.emit("error", Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET" }));
      proxy.emit("error", Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" }));
      proxy.emit("error", Object.assign(new Error("unexpected"), { code: "EOTHER" }));
    } finally {
      console.warn = originalWarn;
    }

    expect(config.server.proxy["/socket.io"].configure).toBe(configureDevSocketProxy);
    expect(isQuietDevProxySocketError({ code: "ECONNRESET" })).toBe(true);
    expect(isQuietDevProxySocketError({ code: "ECONNREFUSED" })).toBe(true);
    expect(isQuietDevProxySocketError({ code: "EOTHER" })).toBe(false);
    expect(warnings).toHaveLength(1);
    expect(warnings[0][0]).toBe("[vite] websocket proxy error:");
  });
});
