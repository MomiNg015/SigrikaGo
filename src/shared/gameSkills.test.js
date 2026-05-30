import { describe, expect, it } from "vitest";
import { normalizeSkillConfig, skillRequiresExistingStone } from "./gameSkills.js";

describe("game skill configuration", () => {
  it("normalizes character ids into executable skill configs", () => {
    expect(normalizeSkillConfig("danea")).toMatchObject({
      characterId: "danea",
      effectType: "flip-stone",
      targetRule: "stone",
      uses: 1
    });
    expect(normalizeSkillConfig("baconbits")).toMatchObject({
      characterId: "baconbits",
      effectType: "random-blast",
      targetRule: "none",
      params: { size: 3 }
    });
  });

  it("identifies skills that need an existing board stone before they can start", () => {
    expect(skillRequiresExistingStone("danea")).toBe(true);
    expect(skillRequiresExistingStone("baconbits")).toBe(true);
    expect(skillRequiresExistingStone("aemeath")).toBe(false);
  });
});
