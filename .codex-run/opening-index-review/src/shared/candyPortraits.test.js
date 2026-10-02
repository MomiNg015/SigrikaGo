import { describe, expect, it } from "vitest";
import { DENIA_CANDY_PORTRAIT, resolveCandyPortrait } from "./candyPortraits.js";

describe("resolveCandyPortrait", () => {
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
