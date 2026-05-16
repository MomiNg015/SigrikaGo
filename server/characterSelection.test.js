import { describe, expect, test } from "vitest";
import { CHARACTERS } from "../src/shared/characters.js";
import { resolveSelectedCharacter } from "./characterSelection.js";

describe("character selection resolution", () => {
  test("falls back unknown selected characters to static Sigrika", () => {
    const result = resolveSelectedCharacter("removed-character", {});

    expect(result.characterId).toBe("sigrika");
    expect(result.characterConfig).toEqual(CHARACTERS.sigrika);
  });

  test("does not allow disabled database rows through static fallback", () => {
    const result = resolveSelectedCharacter("danea", {}, new Set(["danea"]));

    expect(result.characterId).toBe("sigrika");
    expect(result.characterConfig).toEqual(CHARACTERS.sigrika);
  });

  test("allows static fallback when no database row exists", () => {
    const result = resolveSelectedCharacter("danea", {});

    expect(result.characterId).toBe("danea");
    expect(result.characterConfig).toEqual(CHARACTERS.danea);
  });
});
