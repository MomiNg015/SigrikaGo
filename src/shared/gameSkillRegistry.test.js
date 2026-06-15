import { describe, expect, it, vi } from "vitest";
import {
  ACTIVE_SKILL_EFFECT_TYPES,
  activeSkillEffectType,
  executeRegisteredSkill,
  skillConsumesTurn
} from "./gameSkillRegistry.js";

describe("game skill registry", () => {
  it("lists the active skill effect types handled by game.js", () => {
    expect(ACTIVE_SKILL_EFFECT_TYPES).toEqual([
      "erase-point",
      "flip-stone",
      "hidden-hand",
      "random-blast",
      "spray-stone"
    ]);
  });

  it("normalizes missing skill effect type to an empty key", () => {
    expect(activeSkillEffectType(null)).toBe("");
    expect(activeSkillEffectType({})).toBe("");
    expect(activeSkillEffectType({ effectType: "flip-stone" })).toBe("flip-stone");
  });

  it("calls the matching skill handler with the shared dispatch payload", () => {
    const state = { phase: "playing" };
    const skill = { effectType: "flip-stone", name: "染移" };
    const handler = vi.fn(() => ({ ok: true }));

    const result = executeRegisteredSkill({
      state,
      color: "black",
      targetId: "4,4",
      skill,
      handlers: { "flip-stone": handler }
    });

    expect(result).toEqual({ ok: true });
    expect(handler).toHaveBeenCalledWith({
      state,
      color: "black",
      targetId: "4,4",
      skill
    });
  });

  it("returns null for unknown skills", () => {
    expect(executeRegisteredSkill({
      state: {},
      color: "black",
      targetId: null,
      skill: { effectType: "unknown" },
      handlers: {}
    })).toBeNull();
  });

  it("keeps free-turn skill consumption rules centralized", () => {
    expect(skillConsumesTurn({ freeTurn: true })).toBe(false);
    expect(skillConsumesTurn({ freeTurn: false })).toBe(true);
    expect(skillConsumesTurn({})).toBe(true);
    expect(skillConsumesTurn(null)).toBe(true);
  });
});
