import { afterEach, describe, expect, it, vi } from "vitest";
import { CHARACTERS } from "../shared/characters.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import { preloadImageAssets } from "../shared/preloadAssets.js";
import { preloadSiteEntry, SITE_ENTRY_IMAGES, siteEntryPortraits } from "./siteEntryPreload.js";

afterEach(() => vi.useRealTimers());

describe("site entry resources", () => {
  it("includes every default portrait, including Baconbits and public catalog additions, without audio", () => {
    const sources = siteEntryPortraits({ custom: { portrait: "/uploads/custom.webp" } });
    expect(sources).toContain(CHARACTERS.baconbits.portrait);
    expect(sources).toContain("/uploads/custom.webp");
    expect(sources).toEqual(expect.arrayContaining(Object.values(CHARACTERS).map(c => c.portrait).filter(Boolean)));
    expect(new Set(sources).size).toBe(sources.length);
    expect(sources.some(src => /\.(ogg|mp3|wav)$/.test(src))).toBe(false);
  });

  it("waits for images and fonts and reuses only successfully decoded portraits", async () => {
    const characters = { custom: { portrait: "/uploads/custom.webp" } };
    const siteSettings = { preloadTips: "Remote tip" };
    const rememberPortrait = vi.fn();
    const progress = [];
    let releaseFonts;
    const fonts = new Promise(resolve => { releaseFonts = resolve; });
    let imageOptions;
    const preloadImages = vi.fn(async (sources, options) => {
      expect(sources).toEqual(expect.arrayContaining(SITE_ENTRY_IMAGES));
      imageOptions = options;
      options.onLoaded(SITE_ENTRY_IMAGES[0]);
      options.onLoaded("/uploads/custom.webp");
      options.onSkipped(CHARACTERS.baconbits.portrait);
      options.onProgress(1);
    });
    let ready = false;
    const pending = preloadSiteEntry({
      loadCharacters: async () => characters, loadSettings: async () => siteSettings,
      preloadImages, loadFont: () => fonts, rememberPortrait,
      onProgress: value => progress.push(value)
    }).then(data => { ready = true; return data; });
    await vi.waitFor(() => expect(preloadImages).toHaveBeenCalledOnce());
    expect(ready).toBe(false);
    expect(imageOptions.concurrency).toBe(4);
    expect(rememberPortrait).toHaveBeenCalledExactlyOnceWith("/uploads/custom.webp");
    releaseFonts();
    await expect(pending).resolves.toEqual({ characters, siteSettings, skipped: [CHARACTERS.baconbits.portrait] });
    expect(progress.at(-1)).toBe(1);
    expect(progress).toEqual([...progress].sort((a, b) => a - b));
  });

  it("uses local catalogs after public requests or fonts stall", async () => {
    vi.useFakeTimers();
    const pending = preloadSiteEntry({
      loadCharacters: () => new Promise(() => {}),
      loadSettings: async () => { throw new Error("offline"); },
      preloadImages: async (_sources, options) => options.onProgress(1),
      loadFont: () => new Promise(() => {}), timeoutMs: 30
    });
    await vi.runAllTimersAsync();
    const result = await pending;
    expect(result.characters).toBe(CHARACTERS);
    expect(result.siteSettings).toBe(DEFAULT_SITE_SETTINGS);
  });

  it("finishes progress when an image fails or hangs, without marking it ready", async () => {
    vi.useFakeTimers();
    const onLoaded = vi.fn();
    const onSkipped = vi.fn();
    const onProgress = vi.fn();
    const pending = preloadImageAssets(["good", "broken", "hung"], {
      loadImage: src => src === "good" ? Promise.resolve(src)
        : src === "broken" ? Promise.reject(new Error("404")) : new Promise(() => {}),
      onLoaded, onSkipped, onProgress, taskTimeoutMs: 20
    });
    await vi.runAllTimersAsync();
    await pending;
    expect(onLoaded).toHaveBeenCalledExactlyOnceWith("good");
    expect(onSkipped.mock.calls.flat().sort()).toEqual(["broken", "hung"]);
    expect(onProgress).toHaveBeenLastCalledWith(1);
  });
});
