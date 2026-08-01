import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  authPortraitPrewarmSources,
  authPortraitReadySources,
  authPortraitReadyVersion,
  prewarmAuthPortraits,
  resetAuthPortraitPrewarmForTests,
  subscribeAuthPortraitReady
} from "./authPortraitPrewarm.js";

describe("auth portrait prewarm", () => {
  beforeEach(() => {
    resetAuthPortraitPrewarmForTests();
  });

  it("prioritizes Sigrika and Denia before the remaining loading characters", () => {
    const sources = authPortraitPrewarmSources({
      mornye: { id: "mornye", portrait: "/mornye.webp" },
      denia: { id: "denia", portrait: "/denia.webp" },
      baconbits: { id: "baconbits", portrait: "/baconbits.webp" },
      sigrika: { id: "sigrika", portrait: "/sigrika.webp" }
    });

    expect(sources).toEqual(["/sigrika.webp", "/denia.webp", "/mornye.webp"]);
  });

  it("deduplicates an active batch and records each decoded source immediately", async () => {
    let releaseBatch;
    const preloadImages = vi.fn((sources, options) => {
      options.onLoaded(sources[0]);
      return new Promise((resolve) => {
        releaseBatch = resolve;
      });
    });
    const listener = vi.fn();
    const unsubscribe = subscribeAuthPortraitReady(listener);
    const characters = {
      sigrika: { id: "sigrika", portrait: "/sigrika.webp" },
      denia: { id: "denia", portrait: "/denia.webp" }
    };

    const first = prewarmAuthPortraits({ characters, preloadImages });
    const repeated = prewarmAuthPortraits({ characters, preloadImages });

    expect(repeated).toBe(first);
    expect(preloadImages).toHaveBeenCalledTimes(0);
    await Promise.resolve();
    expect(preloadImages).toHaveBeenCalledWith(
      ["/sigrika.webp", "/denia.webp"],
      expect.objectContaining({ concurrency: 2, taskTimeoutMs: 8000 })
    );
    expect(authPortraitReadySources()).toEqual(new Set(["/sigrika.webp"]));
    expect(authPortraitReadyVersion()).toBe(1);
    expect(listener).toHaveBeenCalledTimes(1);

    releaseBatch();
    await first;
    unsubscribe();
  });

  it("keeps failed or skipped sources out of the ready snapshot", async () => {
    const preloadImages = vi.fn(async (sources, options) => {
      options.onLoaded(sources[0]);
      options.onSkipped?.(sources[1]);
    });

    await prewarmAuthPortraits({
      characters: {
        sigrika: { id: "sigrika", portrait: "/sigrika.webp" },
        denia: { id: "denia", portrait: "/denia.webp" }
      },
      preloadImages
    });

    expect(authPortraitReadySources()).toEqual(new Set(["/sigrika.webp"]));
  });
});
