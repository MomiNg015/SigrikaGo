import { describe, expect, it } from "vitest";
import { canPreviewSkillTarget, lastMarkedAction } from "./boardView.js";
import { COLORS, GAME_PHASES } from "./game.js";

describe("board view helpers", () => {
  it("marks normal moves and flip skills", () => {
    const history = [
      { type: "move", id: "3,3", moveNumber: 1 },
      { type: "skill", effectType: "random-blast", id: "9,9", moveNumber: 1 },
      { type: "skill", effectType: "flip-stone", id: "4,4", moveNumber: 2 }
    ];

    expect(lastMarkedAction(history)?.id).toBe("4,4");
    expect(lastMarkedAction(history.slice(0, 2))?.id).toBe("3,3");
  });

  it("does not preview a target marker for no-target skills", () => {
    const game = {
      phase: GAME_PHASES.playing,
      turn: COLORS.black,
      skillUses: { black: 1 }
    };
    const player = {
      color: COLORS.black,
      character: {
        skill: { targetRule: "none" }
      }
    };
    const point = { valid: true, stone: null };

    expect(canPreviewSkillTarget({ game, player, point })).toBe(false);
  });

  it("previews skill targets based on target rule", () => {
    const game = {
      phase: GAME_PHASES.playing,
      turn: COLORS.black,
      skillUses: { black: 1 }
    };
    const emptyPoint = { valid: true, stone: null };
    const stonePoint = { valid: true, stone: COLORS.white };

    expect(canPreviewSkillTarget({
      game,
      player: { color: COLORS.black, character: { skill: { targetRule: "empty-point" } } },
      point: emptyPoint
    })).toBe(true);
    expect(canPreviewSkillTarget({
      game,
      player: { color: COLORS.black, character: { skill: { targetRule: "empty-point" } } },
      point: stonePoint
    })).toBe(false);
    expect(canPreviewSkillTarget({
      game,
      player: { color: COLORS.black, character: { skill: { targetRule: "stone" } } },
      point: stonePoint
    })).toBe(true);
    expect(canPreviewSkillTarget({
      game,
      player: { color: COLORS.black, character: { skill: { targetRule: "any-point" } } },
      point: emptyPoint
    })).toBe(true);
    expect(canPreviewSkillTarget({
      game,
      player: { color: COLORS.black, character: { skill: { targetRule: "none" } } },
      point: emptyPoint
    })).toBe(false);
  });

  it("previews Aemeath hidden-hand skill as an empty intersection target", () => {
    const game = {
      phase: GAME_PHASES.playing,
      turn: COLORS.black,
      skillUses: { black: 1 }
    };

    expect(canPreviewSkillTarget({
      game,
      player: { color: COLORS.black, character: { skill: { effectType: "hidden-hand" } } },
      point: { valid: true, stone: null }
    })).toBe(true);
  });
});
