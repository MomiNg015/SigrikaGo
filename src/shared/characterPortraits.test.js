import { describe, expect, it } from "vitest";
import { DENIA_CANDY_PORTRAIT } from "./candyPortraits.js";
import { resolveCharacterPortrait } from "./characterPortraits.js";

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
});
