import { describe, expect, it } from "vitest";
import { normalizeSkillConfig, skillRequiresExistingStone, skillUsesBoardConfirmation, skillUsesBoardSurfaceConfirmation } from "./gameSkills.js";

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
    expect(normalizeSkillConfig("mornye")).toMatchObject({
      characterId: "mornye",
      effectType: "protocol-takeover",
      targetRule: "empty-point",
      costValue: "2",
      freeTurn: true
    });
    expect(normalizeSkillConfig("changli")).toMatchObject({
      characterId: "changli",
      effectType: "double-move",
      targetRule: "none",
      costValue: "3",
      freeTurn: true,
      params: { moves: 2 }
    });
    expect(normalizeSkillConfig("chisa")).toMatchObject({
      characterId: "chisa",
      effectType: "liberty-purge",
      targetRule: "legal-move-point",
      costValue: "0",
      freeTurn: false
    });
  });

  it("identifies skills that need an existing board stone before they can start", () => {
    expect(skillRequiresExistingStone("denia")).toBe(true);
    expect(skillRequiresExistingStone("baconbits")).toBe(true);
    expect(skillRequiresExistingStone("lynae")).toBe(true);
    expect(skillRequiresExistingStone("qiuyuan")).toBe(false);
    expect(skillRequiresExistingStone("mornye")).toBe(false);
    expect(skillRequiresExistingStone("changli")).toBe(false);
    expect(skillRequiresExistingStone("chisa")).toBe(false);
    expect(skillRequiresExistingStone("aemeath")).toBe(false);
  });

  it("identifies no-target skills that use the board click as release confirmation", () => {
    expect(skillUsesBoardConfirmation("baconbits")).toBe(true);
    expect(skillUsesBoardConfirmation({ effectType: "random-blast", targetRule: "none" })).toBe(true);
    expect(skillUsesBoardConfirmation("changli")).toBe(true);
    expect(skillUsesBoardSurfaceConfirmation("changli")).toBe(true);
    expect(skillUsesBoardConfirmation({ effectType: "voyage-star", targetRule: "none" })).toBe(true);
    expect(skillUsesBoardSurfaceConfirmation({ effectType: "voyage-star", targetRule: "none" })).toBe(true);
    expect(skillUsesBoardSurfaceConfirmation("baconbits")).toBe(false);
    expect(skillUsesBoardConfirmation("denia")).toBe(false);
    expect(skillUsesBoardConfirmation("sigrika")).toBe(false);
  });
});
