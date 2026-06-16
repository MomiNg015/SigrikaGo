import { describe, expect, it } from "vitest";
import { COLORS, createGameState, pointId } from "./game.js";
import {
  ACTIVE_SKILL_HANDLERS,
  executeActiveSkillHandler
} from "./gameSkillHandlers.js";

describe("game skill handlers", () => {
  it("keeps concrete active skill handlers outside the core game flow", () => {
    expect(Object.keys(ACTIVE_SKILL_HANDLERS)).toEqual([
      "erase-point",
      "flip-stone",
      "hidden-hand",
      "random-blast",
      "row-slash",
      "spray-stone"
    ]);
  });

  it("dispatches through the active skill handler registry", () => {
    const state = createGameState([{ color: COLORS.black }, { color: COLORS.white }]);
    const targetId = pointId(3, 3);
    const result = executeActiveSkillHandler({
      state,
      color: COLORS.black,
      targetId,
      skill: {
        effectType: "erase-point",
        freeTurn: true,
        name: "Test Erase",
        costType: "numeric",
        costValue: "0"
      }
    });

    expect(result.ok).toBe(true);
    expect(result.state.points.find((point) => point.id === targetId).valid).toBe(false);
  });

  it("returns null for unknown active skill handlers", () => {
    expect(executeActiveSkillHandler({
      state: {},
      color: COLORS.black,
      targetId: null,
      skill: { effectType: "unknown" }
    })).toBeNull();
  });
});
