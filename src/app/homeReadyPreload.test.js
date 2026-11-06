import { expect, it, vi } from "vitest";
import { preloadHomeReady, preloadPlayerWindows } from "./homeReadyPreload.js";
it("waits for required fonts and dependencies while leaving IRIS to its window", async () => {
  let release;
  const loadFont = vi.fn(async () => []);
  let ready = false;
  const pending = preloadHomeReady({ loaders: [() => new Promise(resolve => { release = resolve; })], loadFont }).then(() => { ready = true; });
  await Promise.resolve();
  expect(ready).toBe(false);
  expect(loadFont).toHaveBeenCalledWith('400 16px "Sigrika Window Title"');
  expect(loadFont).not.toHaveBeenCalledWith('400 16px "IRIS Dotted Songti Circle"');
  release(); await pending;
  expect(ready).toBe(true);
  await expect(preloadHomeReady({ loaders: [async () => { throw new Error("offline"); }], loadFont })).rejects.toThrow("offline");
});

it("allows home entry while a window module is pending or failed", async () => {
  let release;
  const warming = preloadPlayerWindows({ loaders: [() => new Promise((resolve) => { release = resolve; }), () => { throw new Error("404"); }] });
  await preloadHomeReady({ loadFont: async () => [] });
  release();
  expect((await warming).map((result) => result.status)).toEqual(["fulfilled", "rejected"]);
});

it("bounds a stalled required font", async () => {
  await expect(preloadHomeReady({ loadFont: () => new Promise(() => {}), timeoutMs: 20 })).rejects.toThrow("字体加载超时");
});
