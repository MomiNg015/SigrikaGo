import { describe, expect, test } from "vitest";
import config from "../vite.config.js";

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
});
