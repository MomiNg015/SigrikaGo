import { describe, expect, test } from "vitest";
import {
  BACONBITS_IMAGE,
  CHANGLI_FIRE_PHOENIX_IMAGE,
  CHANGLI_FLAME_SPRITE_IMAGE,
  DANEA_BUBBLE_IMAGE,
  VOYAGE_STAR_CRATER_IMAGE,
  boardSkillEffectAssetUrls
} from "./boardSkillEffectAssets.js";

describe("boardSkillEffectAssets", () => {
  test("keeps preloadable Pixi asset URLs outside the renderer registry", () => {
    expect(CHANGLI_FIRE_PHOENIX_IMAGE).toBe("/assets/effects/changli-fire-phoenix.svg");
    expect(CHANGLI_FLAME_SPRITE_IMAGE).toBe("/assets/effects/changli-flame-sprite.svg");
    expect(DANEA_BUBBLE_IMAGE).toBe("/assets/effects/denia-bubble-pop.webp");
    expect(VOYAGE_STAR_CRATER_IMAGE).toBe("/assets/effects/voyage-star-crater.webp");
    expect(BACONBITS_IMAGE).toBe("/assets/baconbits.webp");
  });

  test("exposes banner-window preload URLs without loading the renderer map", () => {
    expect(boardSkillEffectAssetUrls("double-move")).toEqual([
      "/assets/effects/changli-fire-phoenix.svg",
      "/assets/effects/changli-flame-sprite.svg"
    ]);
    expect(boardSkillEffectAssetUrls("voyage-star")).toEqual(["/assets/effects/voyage-star-crater.webp"]);
    expect(boardSkillEffectAssetUrls("flip-stone")).toEqual(["/assets/effects/denia-bubble-pop.webp"]);
    expect(boardSkillEffectAssetUrls("random-blast")).toEqual(["/assets/baconbits.webp"]);
    expect(boardSkillEffectAssetUrls("row-slash")).toEqual([]);
    expect(boardSkillEffectAssetUrls("unknown-effect")).toEqual([]);
  });
});
