import { expect, it } from "vitest";
import { CHARACTERS } from "./characters.js";
import { DENIA_CANDY_PORTRAIT_ASSET as asset } from "./characterPortraitAssetCatalog.js";
import { resolveCharacterPortrait } from "./characterPortraits.js";
import { resolveHandbookPortrait } from "./handbookPortraits.js";
import { resolveStoryPortraitPresentation, storyAvatarUrls } from "./characterStorySprites.js";
import { RUNTIME_IMAGE_ASSETS } from "./assetRegistry.js";

const itemEffects = { deniaRainbowGlow: true };

it("uses the cropped candy avatar for small portraits while keeping full-body and costume uses", () => {
  expect(resolveCharacterPortrait(CHARACTERS.denia, { itemEffects, variant: "avatar" })).toBe(asset.avatarUrl);
  expect(resolveCharacterPortrait(CHARACTERS.denia, { itemEffects })).toBe(asset.url);
  expect(resolveCharacterPortrait(CHARACTERS.denia, { variant: "avatar" }))
    .toBe("/assets/characters/handbook-chibi-sprites/denia-avatar.webp");
  expect(resolveCharacterPortrait(CHARACTERS.denia, { itemEffects, variant: "avatar",
    costumeSnapshot: { candyEffectPortraitUrl: "/custom-candy.webp" } })).toBe("/custom-candy.webp");
  expect(RUNTIME_IMAGE_ASSETS.effects).toContain(asset.avatarUrl);
});

it("keeps the same chibi composition landmarks and provides the profile avatar companion", () => {
  const normal = resolveHandbookPortrait(CHARACTERS.denia, { chibi: true });
  const candy = resolveHandbookPortrait(CHARACTERS.denia, { chibi: true, itemEffects });
  for (const key of ["isChibi", "isStandard", "width", "height", "focal", "headWidth", "cropWidth", "bodyTop", "bodyBottom"]) {
    expect(candy[key], key).toEqual(normal[key]);
  }
  expect(candy.src).toBe(asset.storyUrl);
  expect(candy.src.replace(/\.webp$/, "-avatar.webp")).toBe(asset.avatarUrl);
});

it("uses matching avatar, still and fallback for the special story identity", () => {
  const node = { characterId: "denia-rainbow-glow" };
  expect(resolveStoryPortraitPresentation(node, { variant: "avatar" })).toMatchObject({
    src: asset.avatarUrl, stillSrc: asset.avatarStillUrl,
    fallbackSrc: "/assets/characters/handbook-chibi-sprites/denia-avatar.webp"
  });
  expect(storyAvatarUrls([node])).toEqual([asset.avatarUrl]);
  expect(resolveStoryPortraitPresentation(node).src).toBe(asset.storyUrl);
});
