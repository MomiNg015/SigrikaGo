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

    expect(result.characterId).toBe("denia");
    expect(result.characterConfig).toEqual({ ...CHARACTERS.danea, id: "denia" });
  });

  test("keeps enabled canonical Denia when a disabled legacy Danea row also exists", () => {
    const denia = { ...CHARACTERS.danea, id: "denia", name: "达妮娅" };
    const result = resolveSelectedCharacter("denia", { denia }, new Set(["denia"]), ["denia"]);

    expect(result.characterId).toBe("denia");
    expect(result.characterConfig).toEqual(denia);
  });

  test("falls back when the selected character is not owned", () => {
    const result = resolveSelectedCharacter("nabomo", {}, new Set(), ["sigrika", "danea", "aemeath"]);

    expect(result.characterId).toBe("sigrika");
    expect(result.characterConfig).toEqual(CHARACTERS.sigrika);
  });

  test("does not fall back to disabled static Sigrika when another static character is enabled", () => {
    const result = resolveSelectedCharacter("removed-character", {}, new Set(["sigrika"]));

    expect(result.characterId).toBe("denia");
    expect(result.characterConfig).toEqual({ ...CHARACTERS.danea, id: "denia" });
  });
});
