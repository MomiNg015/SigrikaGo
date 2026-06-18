import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CHARACTER_SKILL_VOICES, CHARACTER_SYSTEM_VOICES, MUSIC_TRACKS } from "./musicLibrary.js";
import { DENIA_CANDY_PORTRAIT } from "./candyPortraits.js";
import { RUNTIME_AUDIO_ASSETS, RUNTIME_IMAGE_ASSETS } from "./assetRegistry.js";
import { deploymentSocketBase, loginPreloadAssets, playbackAssetSources, preloadLoginAssets } from "./preloadAssets.js";

describe("deployment preload asset helpers", () => {
  it("uses same-origin socket connections in the browser", () => {
    expect(deploymentSocketBase({ origin: "https://sigrika.fun" })).toBe("https://sigrika.fun");
  });

  it("extracts intro-loop playback assets for preloading", () => {
    expect(playbackAssetSources(MUSIC_TRACKS["battle-default"].playback)).toEqual([
      "/assets/music/shanjifu_intro_once.ogg",
      "/assets/music/shanjifu_loop.ogg"
    ]);
  });

  it("groups first-screen assets separately from deferred runtime media after login", () => {
    const assets = loginPreloadAssets({
      characters: {
        sigrika: { portrait: "/assets/sigrika_centered.webp" },
        aemeath: { portrait: "/assets/Aemeath_centered.webp" }
      },
      ownedCharacters: ["sigrika"],
      tracks: MUSIC_TRACKS,
      skillVoices: CHARACTER_SKILL_VOICES,
      systemVoices: CHARACTER_SYSTEM_VOICES
    });

    expect(assets.images).toContain("/assets/sigrika_centered.webp");
    expect(assets.images).toContain("/assets/Aemeath_centered.webp");
    expect(assets.criticalImages).toContain("/assets/sigrika_centered.webp");
    expect(assets.criticalImages).toContain("/assets/Aemeath_centered.webp");
    expect(assets.images).toContain("/assets/home/fantasy-match-entry.webp");
    expect(assets.images).toContain("/assets/home/book-entry.webp");
    expect(assets.images).toContain("/assets/home/multipurpose-classroom-bg.webp");
    expect(assets.criticalImages).toContain("/assets/home/fantasy-match-entry.webp");
    expect(assets.criticalImages).toContain("/assets/home/book-entry.webp");
    expect(assets.criticalImages).toContain("/assets/home/multipurpose-classroom-bg.webp");
    expect(assets.images).toContain("/assets/zahiya_shop.webp");
    expect(assets.images).toContain("/assets/items/rainbow-bean-candy.webp");
    expect(assets.deferredImages).toContain("/assets/zahiya_shop.webp");
    expect(assets.deferredImages).toContain("/assets/items/rainbow-bean-candy.webp");
    expect(assets.images).toContain("/assets/effects/denia-bubble-pop.webp");
    expect(assets.images).toContain(DENIA_CANDY_PORTRAIT);
    expect(assets.audio).toContain("/assets/music/godown_clear.ogg");
    expect(assets.audio).toContain("/assets/music/ui_close_window.ogg");
    expect(assets.audio).toContain("/assets/music/ui_confirm.ogg");
    expect(assets.audio).toContain("/assets/music/ui_detail_open.ogg");
    expect(assets.audio).toContain("/assets/music/ui_house_open.ogg");
    expect(assets.audio).toContain("/assets/music/ui_match_open.ogg");
    expect(assets.audio).toContain("/assets/music/ui_shop_open.ogg");
    expect(assets.audio).toContain("/assets/music/ui_unavailable.ogg");
    expect(assets.criticalAudio).toContain("/assets/music/godown_clear.ogg");
    expect(assets.criticalAudio).toContain("/assets/music/ui_confirm.ogg");
    expect(assets.audio).toContain("/assets/music/main_bgm.ogg");
    expect(assets.audio).toContain("/assets/music/shanjifu_loop.ogg");
    expect(assets.audio).toContain("/assets/music/bgm_intro_once.ogg");
    expect(assets.audio).toContain("/assets/music/sigrika_loop.ogg");
    expect(assets.audio).toContain("/assets/music/busizhe_loop.ogg");
    expect(assets.audio).toContain("/assets/music/qiuyuan_loop.ogg");
    expect(assets.audio).toContain("/assets/music/lynae_loop.ogg");
    expect(assets.audio).toContain("/assets/music/chisa_loop.ogg");
    expect(assets.audio).toContain("/assets/music/changli_loop.ogg");
    expect(assets.audio).toContain("/assets/music/mornye_loop.ogg");
    expect(assets.deferredAudio).toContain("/assets/music/main_bgm.ogg");
    expect(assets.deferredAudio).toContain("/assets/music/shanjifu_loop.ogg");
    expect(assets.deferredAudio).toContain("/assets/music/qiuyuan_loop.ogg");
    expect(assets.deferredAudio).toContain("/assets/music/lynae_loop.ogg");
    expect(assets.deferredAudio).toContain("/assets/music/chisa_loop.ogg");
    expect(assets.deferredAudio).toContain("/assets/music/changli_loop.ogg");
    expect(assets.deferredAudio).toContain("/assets/music/mornye_loop.ogg");
    expect(assets.audio).toContain("/assets/voice/sigrika_skill_cast.ogg");
    expect(assets.audio).toContain("/assets/voice/denia_skill_cast.ogg");
    expect(assets.audio).toContain("/assets/voice/baconbits_skill_cast.ogg");
    expect(assets.audio).toContain("/assets/voice/baconbits_result_win.ogg");
    expect(assets.audio).toContain("/assets/voice/baconbits_result_loss.ogg");
    expect(assets.audio).toContain("/assets/voice/sigrika_countdown_10.ogg");
  });

  it("derives static image preload groups from the runtime asset registry", () => {
    const assets = loginPreloadAssets();

    expect(assets.criticalImages).toEqual(expect.arrayContaining(RUNTIME_IMAGE_ASSETS.home));
    expect(assets.deferredImages).toEqual(expect.arrayContaining(RUNTIME_IMAGE_ASSETS.shop));
    expect(assets.deferredImages).toEqual(expect.arrayContaining(RUNTIME_IMAGE_ASSETS.effects));
  });

  it("derives critical interaction audio from the runtime asset registry", () => {
    const assets = loginPreloadAssets();

    expect(assets.criticalAudio).toEqual(expect.arrayContaining(RUNTIME_AUDIO_ASSETS.interaction));
  });

  it("keeps the runtime asset registry independent from playback implementations", () => {
    const registrySource = fs.readFileSync(path.resolve("src/shared/assetRegistry.js"), "utf8");

    expect(registrySource).not.toContain("../audio/");
  });

  it("preloads the candy portrait even before the active user has the candy effect", () => {
    const assets = loginPreloadAssets({
      characters: {
        denia: { portrait: "/assets/Danea_centered.webp" }
      },
      itemEffects: {}
    });

    expect(assets.images).toContain("/assets/Danea_centered.webp");
    expect(assets.images).toContain(DENIA_CANDY_PORTRAIT);
  });

  it("resolves after critical assets and defers non-critical media with a concurrency limit", async () => {
    const events = [];
    let activeDeferred = 0;
    let maxDeferred = 0;
    const deferredCompletions = [];
    const deferredPromise = new Promise((resolve) => deferredCompletions.push(resolve));
    const load = async (src) => {
      events.push(`start:${src}`);
      if (src.startsWith("deferred")) {
        activeDeferred += 1;
        maxDeferred = Math.max(maxDeferred, activeDeferred);
        await deferredPromise;
        activeDeferred -= 1;
      }
      events.push(`done:${src}`);
      return src;
    };

    await preloadLoginAssets({
      criticalImages: ["critical-image"],
      criticalAudio: ["critical-audio"],
      deferredImages: ["deferred-image-1", "deferred-image-2"],
      deferredAudio: ["deferred-audio-1", "deferred-audio-2"]
    }, {
      concurrency: 1,
      loadImage: load,
      loadAudio: load,
      loadEffectAudio: load
    });

    expect(events).toEqual([
      "start:critical-image",
      "done:critical-image",
      "start:critical-audio",
      "done:critical-audio",
      "start:deferred-image-1"
    ]);
    expect(maxDeferred).toBe(1);
    deferredCompletions.forEach((resolve) => resolve());
  });

  it("does not keep login preload stuck when a critical asset loader never settles", async () => {
    const events = [];
    const never = () => new Promise(() => {});
    const load = async (src) => {
      events.push(`done:${src}`);
      return src;
    };

    const result = await Promise.race([
      preloadLoginAssets({
        criticalImages: ["hung-image"],
        criticalAudio: ["critical-audio"]
      }, {
        concurrency: 1,
        taskTimeoutMs: 1,
        loadImage: never,
        loadAudio: load,
        loadEffectAudio: load,
        onProgress: (progress) => events.push(`progress:${progress}`)
      }).then(() => "resolved"),
      new Promise((resolve) => setTimeout(() => resolve("stuck"), 25))
    ]);

    expect(result).toBe("resolved");
    expect(events).toEqual([
      "progress:0.5",
      "done:critical-audio",
      "progress:1"
    ]);
  });

  it("keeps the project check command as the core handoff gate", () => {
    const packageJson = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8"));

    expect(packageJson.scripts.check).toContain("npm test && npm run build");
    expect(packageJson.scripts.check).toContain("scripts/check-production-config.mjs");
    expect(packageJson.scripts.check).toContain("JWT_SECRET");
    expect(packageJson.scripts.check).toContain("PUBLIC_ORIGIN");
    expect(packageJson.scripts.check).toContain("npm run docs:system-design");
    expect(packageJson.scripts["check:production"]).toBe("node scripts/check-production-config.mjs");
  });
});
