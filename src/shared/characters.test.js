import { describe, expect, it } from "vitest";
import { CHARACTERS, characterList, mergeCharacters } from "./characters.js";

describe("character fallback", () => {
  it("keeps built-in characters available before API load", () => {
    expect(characterList.map((character) => character.id)).toContain("sigrika");
    expect(characterList.map((character) => character.id)).toContain("danea");
  });

  it("merges API characters over fallback fields without losing required display data", () => {
    const merged = mergeCharacters([
      { id: "sigrika", name: "", skill: { name: "API Skill" } },
      { id: "custom", name: "Custom", skill: null },
      null,
      { name: "missing id" }
    ]);

    expect(Object.keys(merged)).toEqual(expect.arrayContaining(["sigrika", "danea", "custom"]));
    expect(merged.sigrika.name).toBe(CHARACTERS.sigrika.name);
    expect(merged.sigrika.portrait).toBe(CHARACTERS.sigrika.portrait);
    expect(merged.sigrika.skill.name).toBe("API Skill");
    expect(merged.sigrika.skill.description).toBe(CHARACTERS.sigrika.skill.description);
    expect(merged.custom.portrait).toBe(CHARACTERS.sigrika.portrait);
    expect(merged.custom.skill.name).toBe(CHARACTERS.sigrika.skill.name);
  });

  it("falls back to built-in characters for empty or malformed API payloads", () => {
    expect(Object.keys(mergeCharacters([]))).toEqual(expect.arrayContaining(["sigrika", "danea"]));
    expect(Object.keys(mergeCharacters("bad payload"))).toEqual(expect.arrayContaining(["sigrika", "danea"]));
  });

  it("removes disabled built-in characters from merged fallback data", () => {
    const merged = mergeCharacters([{ id: "danea", name: "Danea" }], ["sigrika"]);

    expect(merged.sigrika).toBeUndefined();
    expect(merged.danea).toBeDefined();
  });
});
