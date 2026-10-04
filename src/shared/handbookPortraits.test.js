import { afterEach, describe, expect, it } from "vitest";
import { CHARACTER_ALIASES } from "./characterAliases.js";
import {
  CHARACTER_PORTRAIT_ASSETS,
  SIGRIKA_CORRUPTED_PORTRAIT_ASSET,
} from "./characterPortraitAssetCatalog.js";
import { DENIA_CANDY_PORTRAIT } from "./candyPortraits.js";
import { resolveHandbookPortrait } from "./handbookPortraits.js";

const standardIds = [
  "sigrika", "denia", "aemeath", "lynae", "mornye",
  "chisa", "changli", "qiuyuan", "nabomo",
];
const alias = "handbook_portrait_test_alias";
const framing = {
  portraitScalePercent: 88,
  portraitOffsetXPercent: -2,
  portraitOffsetYPercent: 3,
};
const expectedStyle = { scale: "0.88", translate: "-2% 3%" };

afterEach(() => {
  delete CHARACTER_ALIASES[alias];
});

function builtinCharacter(id) {
  return { id, portrait: CHARACTER_PORTRAIT_ASSETS[id].url };
}

describe("resolveHandbookPortrait default sources", () => {
  it.each(standardIds)("uses the shared full-body sprite and dimensions for builtin %s", (id) => {
    const asset = CHARACTER_PORTRAIT_ASSETS[id];
    for (const portrait of [asset.url, asset.legacyUrl, undefined]) {
      const result = resolveHandbookPortrait({ id, portrait });
      expect(result).toMatchObject({
        src: `/assets/characters/handbook-sprites/${id}.webp`,
        isStandard: true,
        width: 832,
        height: 1216,
        visibleTop: 0,
      });
      expect(result.focal).toHaveLength(2);
      expect(result.focal[0]).toBeGreaterThan(0);
      expect(result.focal[0]).toBeLessThan(result.width);
      expect(result.focal[1]).toBeGreaterThan(0);
      expect(result.focal[1]).toBeLessThan(result.height);
      expect(result.cropWidth).toBeGreaterThan(0);
      expect(result.cropWidth).toBeLessThanOrEqual(result.width);
      expect(result.headWidth).toBeGreaterThan(0);
      expect(result.headWidth).toBeLessThan(result.width);
    }
  });

  it.each([
    CHARACTER_PORTRAIT_ASSETS.baconbits.url,
    CHARACTER_PORTRAIT_ASSETS.baconbits.legacyUrl,
  ])("preserves the existing Baconbits source %s", (portrait) => {
    expect(resolveHandbookPortrait({ id: "baconbits", portrait })).toMatchObject({
      src: portrait,
      isStandard: false,
      width: 900,
      height: 900,
    });
  });

  it.each([
    ["an unknown portrait", { id: "new-member", portrait: "/uploads/new-member-480x960.png" }, "/uploads/new-member-480x960.png"],
    ["a custom builtin portrait", { id: "sigrika", portrait: "/uploads/sigrika-480x960.png" }, "/uploads/sigrika-480x960.png"],
    ["portraitUrl above the builtin default", {
      ...builtinCharacter("sigrika"), portraitUrl: "/uploads/sigrika-1280x720.webp",
    }, "/uploads/sigrika-1280x720.webp"],
  ])("does not replace %s, including non-square custom art", (_name, character, expectedSrc) => {
    const result = resolveHandbookPortrait(character);
    expect(result.src).toBe(expectedSrc);
    expect(result.isStandard).toBe(false);
    expect(result.style).toBeUndefined();
  });

  it("resolves a slug alias to the canonical full-body sprite", () => {
    CHARACTER_ALIASES[alias] = "aemeath";
    expect(resolveHandbookPortrait({ slug: alias, portrait: CHARACTER_PORTRAIT_ASSETS.aemeath.legacyUrl }))
      .toMatchObject({ src: "/assets/characters/handbook-sprites/aemeath.webp", isStandard: true });
  });
});

describe("resolveHandbookPortrait runtime priorities", () => {
  it("prefers an equipped costume over custom and builtin character art while preserving framing", () => {
    const result = resolveHandbookPortrait({
      ...builtinCharacter("sigrika"), portraitUrl: "/uploads/sigrika-custom.png",
    }, {
      user: {
        equippedCostumes: {
          sigrika: { portraitUrl: "/assets/costumes/sigrika-equipped.webp", ...framing },
        },
      },
    });
    expect(result).toMatchObject({
      src: "/assets/costumes/sigrika-equipped.webp", isStandard: false, style: expectedStyle,
    });
  });

  it("keeps costume framing when an equipped costume references the builtin portrait URL", () => {
    const character = builtinCharacter("sigrika");
    const result = resolveHandbookPortrait(character, {
      user: { equippedCostumes: { sigrika: { portraitUrl: character.portrait, ...framing } } },
    });
    expect(result).toMatchObject({ src: character.portrait, isStandard: false, style: expectedStyle });
  });

  it("looks up equipped costumes with the canonical identity of an alias", () => {
    CHARACTER_ALIASES[alias] = "denia";
    expect(resolveHandbookPortrait({ id: alias, portrait: CHARACTER_PORTRAIT_ASSETS.denia.url }, {
      user: { equippedCostumes: { denia: { portraitUrl: "/denia-equipped.webp", ...framing } } },
    })).toMatchObject({ src: "/denia-equipped.webp", isStandard: false, style: expectedStyle });
  });

  it("uses Denia's animated candy source instead of the standard full-body image", () => {
    const result = resolveHandbookPortrait(builtinCharacter("denia"), {
      itemEffects: { deniaRainbowGlow: true },
    });
    expect(result.src).toBe(DENIA_CANDY_PORTRAIT);
    expect(result.isStandard).toBe(false);
    expect(result.style).toBeUndefined();
  });

  it("uses the animated candy fallback above an ordinary costume without inheriting its framing", () => {
    const result = resolveHandbookPortrait(builtinCharacter("denia"), {
      itemEffects: { deniaRainbowGlow: true },
      user: { equippedCostumes: { denia: { portraitUrl: "/denia-equipped.webp", ...framing } } },
    });
    expect(result.src).toBe(DENIA_CANDY_PORTRAIT);
    expect(result.isStandard).toBe(false);
    expect(result.style).toBeUndefined();
  });

  it("uses an equipped costume candy variant with its own framing while the effect is active", () => {
    const result = resolveHandbookPortrait(builtinCharacter("denia"), {
      itemEffects: { deniaRainbowGlow: true },
      user: {
        equippedCostumes: {
          denia: {
            portraitUrl: "/denia-equipped.webp",
            candyEffectPortraitUrl: "/denia-equipped-candy.webp",
            ...framing,
          },
        },
      },
    });
    expect(result).toMatchObject({
      src: "/denia-equipped-candy.webp", isStandard: false, style: expectedStyle,
    });
  });

  it("returns to the ordinary equipped costume when the candy effect is inactive", () => {
    expect(resolveHandbookPortrait(builtinCharacter("denia"), {
      itemEffects: { deniaRainbowGlow: false },
      user: {
        equippedCostumes: {
          denia: {
            portraitUrl: "/denia-equipped.webp",
            candyEffectPortraitUrl: "/denia-equipped-candy.webp",
            ...framing,
          },
        },
      },
    })).toMatchObject({ src: "/denia-equipped.webp", isStandard: false, style: expectedStyle });
  });

  it("applies Denia candy rules through an alias without affecting other characters", () => {
    CHARACTER_ALIASES[alias] = "denia";
    expect(resolveHandbookPortrait({ id: alias, portrait: CHARACTER_PORTRAIT_ASSETS.denia.url }, {
      itemEffects: { deniaRainbowGlow: true },
    })).toMatchObject({ src: DENIA_CANDY_PORTRAIT, isStandard: false });
    expect(resolveHandbookPortrait(builtinCharacter("lynae"), {
      itemEffects: { deniaRainbowGlow: true },
    })).toMatchObject({ src: "/assets/characters/handbook-sprites/lynae.webp", isStandard: true });
  });

  it("prioritizes Sigrika corruption over custom art and equipped costumes without costume framing", () => {
    const result = resolveHandbookPortrait({
      ...builtinCharacter("sigrika"), portraitUrl: "/sigrika-custom.webp",
    }, {
      itemEffects: { deniaRainbowGlow: true },
      user: {
        sigrikaCandyArc: { corrupted: true },
        equippedCostumes: {
          sigrika: { portraitUrl: "/sigrika-equipped.webp", ...framing },
        },
      },
    });
    expect(result.src).toBe(SIGRIKA_CORRUPTED_PORTRAIT_ASSET.url);
    expect(result.isStandard).toBe(false);
    expect(result.style).toBeUndefined();
  });

  it("resolves corruption through an alias and keeps unrelated standard sprites unchanged", () => {
    CHARACTER_ALIASES[alias] = "sigrika";
    const options = { user: { sigrikaCandyArc: { corrupted: true } } };
    expect(resolveHandbookPortrait({ id: alias, portrait: CHARACTER_PORTRAIT_ASSETS.sigrika.url }, options))
      .toMatchObject({ src: SIGRIKA_CORRUPTED_PORTRAIT_ASSET.url, isStandard: false });
    expect(resolveHandbookPortrait(builtinCharacter("mornye"), options))
      .toMatchObject({ src: "/assets/characters/handbook-sprites/mornye.webp", isStandard: true });
  });
});
