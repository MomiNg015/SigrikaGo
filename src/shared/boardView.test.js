import { describe, expect, it } from "vitest";
import { canPreviewSkillTarget, lastMarkedAction } from "./boardView.js";
import { COLORS, GAME_PHASES } from "./game.js";

describe("board view helpers", () => {
  it("marks normal moves and flip skills but not no-target random blasts", () => {
    const history = [
      { type: "move", id: "3,3", moveNumber: 1 },
      { type: "skill", effectType: "random-blast", id: "9,9", moveNumber: 1 },
      { type: "skill", effectType: "flip-stone", id: "4,4", moveNumber: 2 }
    ];

    expect(lastMarkedAction(history)?.id).toBe("4,4");
    expect(lastMarkedAction(history.slice(0, 2))?.id).toBe("3,3");
  });

  it("does not preview a target marker for no-target random blast skills", () => {
    const game = {
      phase: GAME_PHASES.playing,
      turn: COLORS.black,
      skillUses: { black: 1 }
    };
    const player = {
      color: COLORS.black,
      character: {
        skill: { effectType: "random-blast" }
      }
    };
    const point = { valid: true, stone: null };

    expect(canPreviewSkillTarget({ game, player, point })).toBe(false);
  });
});
