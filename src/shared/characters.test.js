import { describe, expect, it } from "vitest";
import { characterList } from "./characters.js";

describe("character fallback", () => {
  it("keeps built-in characters available before API load", () => {
    expect(characterList.map((character) => character.id)).toContain("sigrika");
    expect(characterList.map((character) => character.id)).toContain("danea");
  });
});
