import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CHARACTERS } from "./characters.js";
import { storySpriteProfile } from "./characterStorySprites.js";
import { battlePreloadAssets } from "./preloadAssets.js";
import { RESULT_CHARACTER_EXPRESSIONS, resolveResultCharacterPortrait, resultCharacterPortraitUrls } from "./resultCharacterPortraits.js";

describe("result character expressions", () => {
  it.each(Object.keys(RESULT_CHARACTER_EXPRESSIONS))("uses available default reactions for %s and a surprised draw", (id) => {
    const expressions = RESULT_CHARACTER_EXPRESSIONS[id];
    for (const [outcome, expected] of Object.entries({ ...expressions, draw: "surprised" })) {
      const result = resolveResultCharacterPortrait(CHARACTERS[id], { outcome });
      expect(result.expressionId).toBe(expected);
      expect(storySpriteProfile(id).expressions).toContain(expected);
      expect(existsSync(new URL(`../../public${result.src}`, import.meta.url))).toBe(true);
    }
    expect(resultCharacterPortraitUrls(CHARACTERS[id])).toHaveLength(3);
  });

  it("keeps equipment framing for recovery, while default expressions own the result", () => {
    const costumeSnapshot = { portraitUrl: "/frozen-skin.webp", portraitScale: 1.2 };
    const result = resolveResultCharacterPortrait(CHARACTERS.changli, { outcome: "win", costumeSnapshot });
    expect(result.src).toContain("changli/confident.webp");
    expect(result.style).toBeUndefined();
    expect(result.fallback.src).toBe(costumeSnapshot.portraitUrl);
  });

  it("preserves Baconbits, custom characters and unsupported outcome art", () => {
    expect(resolveResultCharacterPortrait(CHARACTERS.baconbits, { outcome: "draw" }).expressionId).toBe("");
    expect(resolveResultCharacterPortrait({ id: "custom", portrait: "/custom.webp" }, { outcome: "win" }).src).toBe("/custom.webp");
    expect(resolveResultCharacterPortrait(CHARACTERS.sigrika, { outcome: "challenge" }).expressionId).toBe("");
  });

  it("preloads visible result actors without leaking hidden team members", () => {
    const room = { players: [{ characterId: "aemeath", teamLineup: [
      { characterId: "chisa", status: "revealed" }, { characterId: "changli", status: "hidden" }
    ] }] };
    const assets = battlePreloadAssets({ room });
    for (const id of ["aemeath", "chisa"]) {
      expect(assets.criticalImages).toEqual(expect.arrayContaining(resultCharacterPortraitUrls(CHARACTERS[id])));
    }
    for (const src of resultCharacterPortraitUrls(CHARACTERS.changli)) expect(assets.images).not.toContain(src);
  });
});
