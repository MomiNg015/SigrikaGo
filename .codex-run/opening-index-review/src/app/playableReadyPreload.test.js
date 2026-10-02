import { describe, expect, it, vi } from "vitest";
import {
  preloadPlayableReady,
  resetPlayableReadyPreloadForTests,
  schedulePlayableReadyIdlePreload
} from "./playableReadyPreload.js";

describe("playable ready preload", () => {
  it("deduplicates core module preloads across repeated calls", async () => {
    resetPlayableReadyPreloadForTests();
    const moduleLoaders = [
      vi.fn(async () => ({ default: "battle" })),
      vi.fn(async () => ({ default: "modal" }))
    ];

    await Promise.all([
      preloadPlayableReady({ moduleLoaders }),
      preloadPlayableReady({ moduleLoaders })
    ]);

    expect(moduleLoaders[0]).toHaveBeenCalledTimes(1);
    expect(moduleLoaders[1]).toHaveBeenCalledTimes(1);
  });

  it("preloads Pixi only for skill-enabled match modes when requested", async () => {
    resetPlayableReadyPreloadForTests();
    const loadPixi = vi.fn(async () => ({ Application: class {} }));

    await preloadPlayableReady({
      includePixi: true,
      loadPixi,
      mode: "gomoku",
      moduleLoaders: []
    });
    await preloadPlayableReady({
      includePixi: true,
      loadPixi,
      mode: "standard",
      moduleLoaders: []
    });
    await preloadPlayableReady({
      includePixi: true,
      loadPixi,
      mode: "spark",
      moduleLoaders: []
    });
    await preloadPlayableReady({
      includePixi: true,
      loadPixi,
      mode: "spark",
      moduleLoaders: []
    });

    expect(loadPixi).toHaveBeenCalledTimes(1);
  });

  it("uses requestIdleCallback for home idle prewarm when available", () => {
    const callback = vi.fn();
    const requestIdleCallback = vi.fn(() => 42);
    const cancelIdleCallback = vi.fn();

    const cancel = schedulePlayableReadyIdlePreload(callback, {
      windowLike: { requestIdleCallback, cancelIdleCallback }
    });

    expect(requestIdleCallback).toHaveBeenCalledWith(callback, { timeout: 1400 });
    cancel();
    expect(cancelIdleCallback).toHaveBeenCalledWith(42);
  });
});
