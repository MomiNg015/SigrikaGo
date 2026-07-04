import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { CHARACTER_SKILL_VOICES, CHARACTER_SYSTEM_VOICES, MUSIC_TRACKS } from "./musicLibrary.js";
import { DENIA_CANDY_PORTRAIT } from "./candyPortraits.js";
import { RUNTIME_AUDIO_ASSETS, RUNTIME_IMAGE_ASSETS } from "./assetRegistry.js";
import { battlePreloadAssets, deploymentSocketBase, loginPreloadAssets, playbackAssetSources, preloadLoginAssets, retrySkippedPreloadAssets } from "./preloadAssets.js";

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

  it("blocks login preload on current-user accessible home, shop, character, and owned music assets", () => {
    const assets = loginPreloadAssets({
      characters: {
        sigrika: { id: "sigrika", portrait: "/assets/sigrika_centered.webp" },
        aemeath: { id: "aemeath", portrait: "/assets/Aemeath_centered.webp" }
      },
      user: {
        ownedCharacters: ["sigrika"],
        ownedMusicIds: ["qiuyuan-skill-zhouwo"],
        ownedDecorations: ["paw-stone"],
        achievementEquipmentAssets: {
          nameplate: { imageUrl: "/assets/achievements/semantic-nameplate.png" }
        }
      },
      shopItems: [
        { imageUrl: "/assets/items/shop-only.webp" }
      ],
      inventoryItems: [
        { imageUrl: "/assets/items/inventory-only.webp" }
      ],
      tracks: MUSIC_TRACKS,
      skillVoices: CHARACTER_SKILL_VOICES,
      systemVoices: CHARACTER_SYSTEM_VOICES
    });

    expect(assets.images).toContain("/assets/sigrika_centered.webp");
    expect(assets.images).not.toContain("/assets/Aemeath_centered.webp");
    expect(assets.criticalImages).toContain("/assets/sigrika_centered.webp");
    expect(assets.images).toContain("/assets/home/fantasy-match-entry.webp");
    expect(assets.images).toContain("/assets/home/book-entry.webp");
    expect(assets.images).toContain("/assets/home/home-utility-recruitment.webp");
    expect(assets.images).toContain("/assets/home/home-utility-shop.webp");
    expect(assets.images).toContain("/assets/home/home-utility-warehouse.webp");
    expect(assets.images).toContain("/assets/home/home-utility-leaderboard.webp");
    expect(assets.images).toContain("/assets/home/home-utility-watch.webp");
    expect(assets.images).toContain("/assets/home/home-utility-friends.webp");
    expect(assets.images).toContain("/assets/home/multipurpose-classroom-bg.webp");
    expect(assets.criticalImages).toContain("/assets/home/fantasy-match-entry.webp");
    expect(assets.criticalImages).toContain("/assets/home/book-entry.webp");
    expect(assets.criticalImages).toContain("/assets/home/home-utility-recruitment.webp");
    expect(assets.criticalImages).toContain("/assets/home/home-utility-shop.webp");
    expect(assets.criticalImages).toContain("/assets/home/home-utility-warehouse.webp");
    expect(assets.criticalImages).toContain("/assets/home/home-utility-leaderboard.webp");
    expect(assets.criticalImages).toContain("/assets/home/home-utility-watch.webp");
    expect(assets.criticalImages).toContain("/assets/home/home-utility-friends.webp");
    expect(assets.criticalImages).toContain("/assets/home/multipurpose-classroom-bg.webp");
    expect(assets.images).toContain("/assets/zahiya_shop.webp");
    expect(assets.images).toContain("/assets/items/qiuyuan-zhouwo.webp");
    expect(assets.images).toContain("/assets/items/rainbow-bean-candy.webp");
    expect(assets.criticalImages).toContain("/assets/items/shop-only.webp");
    expect(assets.criticalImages).toContain("/assets/items/inventory-only.webp");
    expect(assets.criticalImages).toContain("/assets/achievements/semantic-nameplate.png");
    expect(assets.deferredImages).toEqual([]);
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
    expect(assets.audio).toContain("/assets/music/sigrika_loop.ogg");
    expect(assets.audio).toContain("/assets/music/qiuyuan_zhouwo_loop.ogg");
    expect(assets.audio).not.toContain("/assets/music/aemeath0_loop.ogg");
    expect(assets.audio).not.toContain("/assets/music/qiuyuan_loop.ogg");
    expect(assets.audio).not.toContain("/assets/music/lynae_loop.ogg");
    expect(assets.deferredAudio).toEqual([]);
    expect(assets.audio).toContain("/assets/voice/sigrika_skill_cast.ogg");
    expect(assets.audio).not.toContain("/assets/voice/qiuyuan_skill_cast.ogg");
    expect(assets.audio).toContain("/assets/voice/sigrika_countdown_10.ogg");
  });

  it("derives static image preload groups from the runtime asset registry", () => {
    const assets = loginPreloadAssets();

    expect(assets.criticalImages).toEqual(expect.arrayContaining(RUNTIME_IMAGE_ASSETS.home));
    expect(assets.criticalImages).toEqual(expect.arrayContaining(RUNTIME_IMAGE_ASSETS.shop));
    expect(assets.deferredImages).toEqual([]);
  });

  it("derives critical interaction audio from the runtime asset registry", () => {
    const assets = loginPreloadAssets();

    expect(assets.criticalAudio).toEqual(expect.arrayContaining(RUNTIME_AUDIO_ASSETS.interaction));
  });

  it("builds battle preload assets from both room player characters", () => {
    const assets = battlePreloadAssets({
      room: {
        players: [
          { characterId: "changli" },
          { characterId: "nabomo" }
        ]
      },
      characters: {
        changli: { id: "changli", portrait: "/assets/characters/changli.png" },
        nabomo: { id: "nabomo", portrait: "/assets/nabomo.webp" }
      },
      tracks: MUSIC_TRACKS,
      skillVoices: CHARACTER_SKILL_VOICES,
      systemVoices: CHARACTER_SYSTEM_VOICES
    });

    expect(assets.criticalImages).toContain("/assets/characters/changli.png");
    expect(assets.criticalImages).toContain("/assets/nabomo.webp");
    expect(assets.criticalImages).toEqual(expect.arrayContaining(RUNTIME_IMAGE_ASSETS.effects));
    expect(assets.criticalAudio).toContain("/assets/music/changli_loop.ogg");
    expect(assets.criticalAudio).toContain("/assets/music/busizhe_loop.ogg");
    expect(assets.criticalAudio).toContain("/assets/voice/changli_skill_cast.ogg");
    expect(assets.criticalAudio).toContain("/assets/voice/changli_wuzi_match_start.ogg");
    expect(assets.criticalAudio).toContain("/assets/voice/nabomo_skill_cast.ogg");
  });

  it("preloads derived skill tracks for matching room characters even when selectable", () => {
    const assets = battlePreloadAssets({
      room: { players: [{ characterId: "aemeath" }] },
      characters: { aemeath: { id: "aemeath", portrait: "/assets/Aemeath_centered.webp" } },
      tracks: {
        ...MUSIC_TRACKS,
        "aemeath-voyage-star-default": {
          ...MUSIC_TRACKS["aemeath-voyage-star-default"],
          selectable: true,
          playback: { mode: "single-loop", src: "/assets/music/voyage-star-test.ogg", loop: true }
        }
      },
      skillVoices: {},
      systemVoices: {}
    });

    expect(assets.criticalAudio).toContain("/assets/music/voyage-star-test.ogg");
  });

  it("skips skill-specific battle resources when the current mode disables skills", () => {
    const assets = battlePreloadAssets({
      room: {
        mode: "gomoku",
        players: [
          { characterId: "changli" }
        ]
      },
      characters: {
        changli: { id: "changli", portrait: "/assets/characters/changli.png" }
      },
      tracks: MUSIC_TRACKS,
      skillVoices: CHARACTER_SKILL_VOICES,
      systemVoices: CHARACTER_SYSTEM_VOICES
    });

    expect(assets.criticalImages).toContain("/assets/characters/changli.png");
    expect(assets.criticalImages).not.toEqual(expect.arrayContaining(RUNTIME_IMAGE_ASSETS.effects));
    expect(assets.criticalAudio).toContain("/assets/music/shanjifu_loop.ogg");
    expect(assets.criticalAudio).not.toContain("/assets/music/changli_loop.ogg");
    expect(assets.criticalAudio).not.toContain("/assets/voice/changli_skill_cast.ogg");
    expect(assets.criticalAudio).toContain("/assets/voice/changli_wuzi_match_start.ogg");
  });


  it("includes every configured skill voice candidate in battle preload assets", () => {
    const assets = battlePreloadAssets({
      room: {
        players: [
          { characterId: "qiuyuan" }
        ]
      },
      characters: {
        qiuyuan: { id: "qiuyuan", portrait: "/assets/characters/qiuyuan.png" }
      },
      tracks: MUSIC_TRACKS,
      skillVoices: CHARACTER_SKILL_VOICES,
      systemVoices: {}
    });

    expect(assets.criticalAudio).toContain("/assets/voice/qiuyuan_skill_cast.ogg");
    expect(assets.criticalAudio).toContain("/assets/voice/qiuyuan_skill_cast_1.ogg");
  });

  it("keeps startup preload blocking for accessible runtime media instead of deferring it", () => {
    const assets = loginPreloadAssets({
      characters: {
        sigrika: { id: "sigrika", portrait: "/assets/sigrika_centered.webp" }
      },
      user: {
        ownedCharacters: ["sigrika"],
        ownedMusicIds: []
      }
    });

    expect(assets.criticalImages).toEqual(expect.arrayContaining(RUNTIME_IMAGE_ASSETS.home));
    expect(assets.criticalImages).toEqual(expect.arrayContaining(RUNTIME_IMAGE_ASSETS.shop));
    expect(assets.criticalAudio).toEqual(expect.arrayContaining(RUNTIME_AUDIO_ASSETS.interaction));
    expect(assets.criticalAudio).toContain("/assets/music/main_bgm.ogg");
    expect(assets.criticalAudio).toContain("/assets/music/shanjifu_loop.ogg");
    expect(assets.criticalAudio).toContain("/assets/music/sigrika_loop.ogg");
    expect(assets.deferredImages).toEqual([]);
    expect(assets.deferredAudio).toEqual([]);
  });

  it("keeps the runtime asset registry independent from playback implementations", () => {
    const registrySource = fs.readFileSync(path.resolve("src/shared/assetRegistry.js"), "utf8");

    expect(registrySource).not.toContain("../audio/");
  });

  it("only preloads the candy portrait when it is visible through accessible shop or inventory resources", () => {
    const assets = loginPreloadAssets({
      characters: {
        denia: { id: "denia", portrait: "/assets/Danea_centered.webp" }
      },
      user: { ownedCharacters: ["denia"] },
      inventoryItems: [{ imageUrl: DENIA_CANDY_PORTRAIT }]
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
    const skipped = [];
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
        onSkipped: (src) => skipped.push(src),
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
    expect(skipped).toEqual(["hung-image"]);
  });

  it("retries skipped preload assets in the background with the retry concurrency limit", async () => {
    vi.useFakeTimers();
    const events = [];
    const load = async (src) => {
      events.push(src);
      return src;
    };

    const cancel = retrySkippedPreloadAssets(["/assets/a.webp", "/assets/b.ogg"], {
      concurrency: 1,
      loadImage: load,
      loadAudio: load,
      loadEffectAudio: load,
      retryDelaysMs: [0],
      taskTimeoutMs: 1000
    });

    await vi.runOnlyPendingTimersAsync();
    expect(events).toEqual(["/assets/a.webp", "/assets/b.ogg"]);
    cancel();
    vi.useRealTimers();
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
