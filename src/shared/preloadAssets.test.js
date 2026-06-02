import { describe, expect, it } from "vitest";
import { CHARACTER_SKILL_VOICES, CHARACTER_SYSTEM_VOICES, MUSIC_TRACKS } from "./musicLibrary.js";
import { DENIA_CANDY_PORTRAIT } from "./candyPortraits.js";
import { deploymentSocketBase, loginPreloadAssets, playbackAssetSources } from "./preloadAssets.js";

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

  it("preloads core images, effects, all runtime music, and character voices after login", () => {
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
    expect(assets.images).toContain("/assets/home/fantasy-match-entry.webp");
    expect(assets.images).toContain("/assets/home/book-entry.webp");
    expect(assets.images).toContain("/assets/home/multipurpose-classroom-bg.webp");
    expect(assets.images).toContain("/assets/zahiya_shop.webp");
    expect(assets.images).toContain("/assets/items/rainbow-bean-candy.webp");
    expect(assets.images).toContain("/assets/effects/denia-bubble-pop.webp");
    expect(assets.images).toContain(DENIA_CANDY_PORTRAIT);
    expect(assets.audio).toContain("/assets/music/godown_clear.ogg");
    expect(assets.audio).toContain("/assets/music/main_bgm.ogg");
    expect(assets.audio).toContain("/assets/music/shanjifu_loop.ogg");
    expect(assets.audio).toContain("/assets/music/bgm_intro_once.ogg");
    expect(assets.audio).toContain("/assets/music/koimoon_132_micro_loop.ogg");
    expect(assets.audio).toContain("/assets/music/busizhe_loop.ogg");
    expect(assets.audio).toContain("/assets/voice/sigrika_skill_cast.ogg");
    expect(assets.audio).toContain("/assets/voice/denia_skill_cast.ogg");
    expect(assets.audio).toContain("/assets/voice/baconbits_skill.ogg");
    expect(assets.audio).toContain("/assets/voice/sigrika_countdown_10.ogg");
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
});
