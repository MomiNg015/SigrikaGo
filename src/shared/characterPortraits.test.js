import { describe, expect, it } from "vitest";
import { DENIA_CANDY_PORTRAIT } from "./candyPortraits.js";
import {
  resolveCharacterPortrait,
  resolveCharacterPortraitPresentation
} from "./characterPortraits.js";

const character = {
  id: "denia",
  portrait: "/assets/characters/denia.webp"
};

describe("resolveCharacterPortrait", () => {
  it("uses the equipped costume for ordinary portraits", () => {
    expect(resolveCharacterPortrait(character, {
      user: {
        equippedCostumes: {
          denia: { portraitUrl: "/assets/costumes/denia-01.webp" }
        }
      }
    })).toBe("/assets/costumes/denia-01.webp");
  });

  it("keeps the candy effect above ordinary costume art and uses its optional costume variant", () => {
    expect(resolveCharacterPortrait(character, {
      itemEffects: { deniaRainbowGlow: true },
      equippedCostumes: {
        denia: {
          portraitUrl: "/assets/costumes/denia-01.webp",
          candyEffectPortraitUrl: "/assets/costumes/denia-01-candy.webp"
        }
      }
    })).toBe("/assets/costumes/denia-01-candy.webp");
  });

  it("falls back to the base candy portrait when a costume has no candy variant", () => {
    expect(resolveCharacterPortrait(character, {
      itemEffects: { deniaRainbowGlow: true },
      equippedCostumes: {
        denia: { portraitUrl: "/assets/costumes/denia-01.webp", candyEffectPortraitUrl: "" }
      }
    })).toBe(DENIA_CANDY_PORTRAIT);
  });

  it("prefers immutable room snapshots over a later live-user outfit", () => {
    expect(resolveCharacterPortrait(character, {
      user: {
        equippedCostumes: {
          denia: { portraitUrl: "/assets/costumes/denia-later.webp" }
        }
      },
      costumeSnapshot: { portraitUrl: "/assets/costumes/denia-match.webp" }
    })).toBe("/assets/costumes/denia-match.webp");
  });

  it("uses the costume framing values for equipped and snapshotted portraits", () => {
    expect(resolveCharacterPortraitPresentation(character, {
      costumeSnapshot: {
        portraitUrl: "/assets/costumes/denia-match.webp",
        portraitScalePercent: 88,
        portraitOffsetXPercent: -2,
        portraitOffsetYPercent: 3
      }
    })).toMatchObject({
      src: "/assets/costumes/denia-match.webp",
      scalePercent: 88,
      offsetXPercent: -2,
      offsetYPercent: 3,
      style: { scale: "0.88", translate: "-2% 3%" }
    });
  });

  it("does not apply costume framing to the base candy fallback", () => {
    expect(resolveCharacterPortraitPresentation(character, {
      itemEffects: { deniaRainbowGlow: true },
      equippedCostumes: {
        denia: {
          portraitUrl: "/assets/costumes/denia-01.webp",
          portraitScalePercent: 88
        }
      }
    })).toMatchObject({
      src: DENIA_CANDY_PORTRAIT,
      scalePercent: 100,
      style: undefined
    });
  });
});
