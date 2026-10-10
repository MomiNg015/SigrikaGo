import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { DENIA_CANDY_PORTRAIT, resolveCandyPortrait } from "./candyPortraits.js";
import { DENIA_CANDY_PORTRAIT_ASSET } from "./characterPortraitAssetCatalog.js";

describe("resolveCandyPortrait", () => {
  it("ships a looping current-chibi rainbow animation with a stationary source body", async () => {
    const animation = readFileSync(`public${DENIA_CANDY_PORTRAIT_ASSET.storyUrl}`);
    const metadata = await sharp(animation, { animated: true }).metadata();
    expect(metadata).toMatchObject({ width: 832, pageHeight: 1216, pages: 24, hasAlpha: true, loop: 0 });
    expect(metadata.delay).toEqual(Array(24).fill(60));
    const source = await sharp("public/assets/characters/story-sprites/denia/surprised.webp").ensureAlpha().raw().toBuffer();
    const frames = await sharp(animation, { animated: true }).ensureAlpha().raw().toBuffer();
    const size = 832 * 1216 * 4;
    for (let frame = 0; frame < 24; frame++) {
      const current = frames.subarray(frame * size, (frame + 1) * size);
      // Every frame retains the current sprite's lower body, including alpha.
      for (let p = 832 * 850 * 4; p < size; p += 4) {
        if (current[p + 3] !== source[p + 3]) throw new Error(`Body alpha changed in frame ${frame}`);
        if (source[p + 3]) {
          if (!current.subarray(p, p + 3).equals(source.subarray(p, p + 3))) throw new Error(`Body repainted in frame ${frame}`);
        }
      }
    }
    expect(frames.subarray(0, size).equals(frames.subarray(size * 6, size * 7))).toBe(false);
    expect(await sharp(`public${DENIA_CANDY_PORTRAIT_ASSET.storyStillUrl}`).metadata())
      .toMatchObject({ width: 832, height: 1216, hasAlpha: true });
  }, 30000);
  it("replaces Denia portrait with the candy gif while the candy effect is active", () => {
    expect(resolveCandyPortrait(
      { id: "denia", portrait: "/assets/Danea_centered.webp" },
      { deniaRainbowGlow: true }
    )).toBe(DENIA_CANDY_PORTRAIT);
  });

  it("keeps non-Denia and inactive Denia portraits unchanged", () => {
    expect(resolveCandyPortrait(
      { id: "denia", portrait: "/assets/Danea_centered.webp" },
      {}
    )).toBe("/assets/Danea_centered.webp");
    expect(resolveCandyPortrait(
      { id: "sigrika", portrait: "/assets/sigrika_centered.webp" },
      { deniaRainbowGlow: true }
    )).toBe("/assets/sigrika_centered.webp");
  });
});
