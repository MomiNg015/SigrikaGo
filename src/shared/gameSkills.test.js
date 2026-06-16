import { describe, expect, it } from "vitest";
import { normalizeSkillConfig, skillRequiresExistingStone, skillUsesBoardConfirmation } from "./gameSkills.js";

describe("game skill configuration", () => {
  it("normalizes character ids into executable skill configs", () => {
    expect(normalizeSkillConfig("denia")).toMatchObject({
      characterId: "denia",
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
    expect(normalizeSkillConfig("lynae")).toMatchObject({
      characterId: "lynae",
      effectType: "spray-stone",
      targetRule: "stone",
      costValue: "4"
    });
    expect(normalizeSkillConfig("qiuyuan")).toMatchObject({
      characterId: "qiuyuan",
      effectType: "row-slash",
      targetRule: "any-point",
      costValue: "0"
    });
  });

  it("identifies skills that need an existing board stone before they can start", () => {
    expect(skillRequiresExistingStone("denia")).toBe(true);
    expect(skillRequiresExistingStone("baconbits")).toBe(true);
    expect(skillRequiresExistingStone("lynae")).toBe(true);
    expect(skillRequiresExistingStone("qiuyuan")).toBe(false);
    expect(skillRequiresExistingStone("aemeath")).toBe(false);
  });

  it("identifies no-target skills that use the board click as release confirmation", () => {
    expect(skillUsesBoardConfirmation("baconbits")).toBe(true);
    expect(skillUsesBoardConfirmation({ effectType: "random-blast", targetRule: "none" })).toBe(true);
    expect(skillUsesBoardConfirmation("denia")).toBe(false);
    expect(skillUsesBoardConfirmation("sigrika")).toBe(false);
  });
});
