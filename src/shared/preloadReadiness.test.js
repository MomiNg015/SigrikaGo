import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import { loginPreloadAssets, battlePreloadAssets, preloadLoginAssets } from "./preloadAssets.js";
import { RUNTIME_IMAGE_ASSETS, RUNTIME_AUDIO_ASSETS } from "./assetRegistry.js";

describe("critical resource readiness", () => {
  it("keeps voice decoding inside the barrier and uses catalog voice overrides", async () => {
    const assets = battlePreloadAssets({ room: { mode: "classic", players: [{ characterId: "sigrika" }] },
      characters: { sigrika: { id: "sigrika", systemVoices: { "game-start": "/custom.ogg" } } },
      tracks: {}, systemVoices: {}, skillVoices: {} });
    expect(assets.voiceAudio).toContain("/custom.ogg");
    let release;
    const loadVoiceAudio = vi.fn(() => new Promise(resolve => { release = resolve; }));
    const load = vi.fn(async src => src);
    let done = false;
    const pending = preloadLoginAssets(assets, { loadImage: load, loadAudio: load, loadEffectAudio: load,
      loadVoiceAudio, requireComplete: true }).then(() => { done = true; });
    await vi.waitFor(() => expect(loadVoiceAudio).toHaveBeenCalledWith("/custom.ogg"));
    expect(done).toBe(false);
    release({ decoded: true });
    await pending;
    expect(done).toBe(true);
    expect(load).not.toHaveBeenCalledWith("/custom.ogg");
  });
  it("retries failed critical resources before rejecting, without reloading successes", async () => {
    const loadImage = vi.fn(async src => src === "bad" ? null : src);
    await expect(preloadLoginAssets({ images: ["good", "bad"] }, { requireComplete: true, loadImage }))
      .rejects.toMatchObject({ assets: ["bad"] });
    expect(loadImage.mock.calls).toEqual([["good"], ["bad"], ["bad"]]);
  });
  it("recovers a transient critical failure within the loading screen", async () => {
    const loadImage = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce("ready");
    await expect(preloadLoginAssets({ images: ["image"] }, { requireComplete: true, loadImage })).resolves.toBeUndefined();
    expect(loadImage).toHaveBeenCalledTimes(2);
  });
  it("does not treat a timeout as ready", async () => {
    await expect(preloadLoginAssets({ images: ["hung"] }, {
      requireComplete: true, taskTimeoutMs: 1, loadImage: () => new Promise(() => {})
    })).rejects.toMatchObject({ assets: ["hung"] });
  });
  it("registers the real home artwork and verifies deployable local media", () => {
    const assets = loginPreloadAssets({ characters: {}, tracks: {} });
    for (const src of ["home-main-panel-desktop.webp", "home-main-panel-mobile.webp", "student-id-hanging.png", "student-id-nameplate.webp", "home-header-sigrika.gif?v=170ms"]) {
      expect(assets.criticalImages).toContain(`/assets/home/${src}`);
    }
    for (const src of [...RUNTIME_IMAGE_ASSETS.home, ...RUNTIME_AUDIO_ASSETS.interaction]) {
      expect(fs.existsSync(`public${src.split("?")[0]}`), src).toBe(true);
    }
  });
});
