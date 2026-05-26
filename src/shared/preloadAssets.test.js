import { describe, expect, it } from "vitest";
import { CHARACTER_SKILL_VOICES, MUSIC_TRACKS } from "./musicLibrary.js";
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

  it("preloads core images, effects, default music, and owned character voices", () => {
    const assets = loginPreloadAssets({
      characters: {
        sigrika: { portrait: "/assets/sigrika_centered.png" },
        aemeath: { portrait: "/assets/Aemeath_centered.png" }
      },
      ownedCharacters: ["sigrika"],
      tracks: MUSIC_TRACKS,
      skillVoices: CHARACTER_SKILL_VOICES
    });

    expect(assets.images).toContain("/assets/sigrika_centered.png");
    expect(assets.images).toContain("/assets/Aemeath_centered.png");
    expect(assets.audio).toContain("/assets/music/godown_clear.ogg");
    expect(assets.audio).toContain("/assets/music/hidamari_intro_once.ogg");
    expect(assets.audio).toContain("/assets/music/shanjifu_loop.ogg");
    expect(assets.audio).toContain("/assets/voice/sigrika_2_no_exclaim.ogg");
  });
});
