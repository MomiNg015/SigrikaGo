import { expect, it, vi } from "vitest";
import { preloadHomeReady } from "./homeReadyPreload.js";
it("waits for window modules and fonts, and propagates a failed readiness dependency", async () => {
  let release;
  const loadFont = vi.fn(async () => []);
  let ready = false;
  const pending = preloadHomeReady({ loaders: [() => new Promise(resolve => { release = resolve; })], loadFont }).then(() => { ready = true; });
  await Promise.resolve();
  expect(ready).toBe(false);
  expect(loadFont).toHaveBeenCalledWith('400 16px "IRIS Dotted Songti Circle"');
  release(); await pending;
  expect(ready).toBe(true);
  await expect(preloadHomeReady({ loaders: [async () => { throw new Error("offline"); }], loadFont })).rejects.toThrow("offline");
});
