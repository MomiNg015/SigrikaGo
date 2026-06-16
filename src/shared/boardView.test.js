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

  it("previews QiuYuan row slash on any valid intersection", () => {
    const game = {
      phase: GAME_PHASES.playing,
      turn: COLORS.black,
      skillUses: { black: 1 }
    };
    const player = {
      color: COLORS.black,
      character: { skill: { effectType: "row-slash" } }
    };

    expect(canPreviewSkillTarget({
      game,
      player,
      point: { valid: true, stone: null }
    })).toBe(true);
    expect(canPreviewSkillTarget({
      game,
      player,
      point: { valid: true, stone: COLORS.white }
    })).toBe(true);
    expect(canPreviewSkillTarget({
      game,
      player,
      point: { valid: false, stone: COLORS.white }
    })).toBe(false);
  });

  it("previews Chisa targets only on ordinary legal move candidates", () => {
    const game = {
      phase: GAME_PHASES.playing,
      turn: COLORS.black,
      skillUses: { black: 1 },
      ko: "6,6"
    };
    const player = {
      color: COLORS.black,
      character: { skill: { effectType: "liberty-purge", targetRule: "legal-move-point" } }
    };

    expect(canPreviewSkillTarget({
      game,
      player,
      point: { id: "3,3", valid: true, stone: null }
    })).toBe(true);
    expect(canPreviewSkillTarget({
      game,
      player,
      point: { id: "4,4", valid: true, stone: COLORS.white }
    })).toBe(false);
    expect(canPreviewSkillTarget({
      game,
      player,
      point: { id: "6,6", valid: true, stone: null }
    })).toBe(false);
    expect(canPreviewSkillTarget({
      game,
      player,
      point: {
        id: "7,7",
        valid: true,
        stone: null,
        protocolBan: { owner: COLORS.white, bannedColor: COLORS.black, effect: "protocol-takeover" }
      }
    })).toBe(false);
  });

  it("does not preview Baconbits random blast targets", () => {
    const game = {
      phase: GAME_PHASES.playing,
      turn: COLORS.black,
      skillUses: { black: 1 }
    };

    expect(canPreviewSkillTarget({
      game,
      player: { color: COLORS.black, character: { skill: { effectType: "random-blast" } } },
      point: { valid: true, stone: COLORS.white }
    })).toBe(false);
  });

  it("previews Lynae spray targets only for non-spray visible stones", () => {
    const game = {
      phase: GAME_PHASES.playing,
      turn: COLORS.black,
      skillUses: { black: 1 }
    };
    const player = {
      color: COLORS.black,
      character: {
        skill: { effectType: "spray-stone", targetRule: "stone" }
      }
    };

    expect(canPreviewSkillTarget({
      game,
      player,
      point: { valid: true, stone: COLORS.white }
    })).toBe(true);
    expect(canPreviewSkillTarget({
      game,
      player,
      point: { valid: true, stone: "spray" }
    })).toBe(false);
    expect(canPreviewSkillTarget({
      game,
      player,
      point: {
        valid: true,
        stone: COLORS.white,
        hiddenHand: { owner: COLORS.white, exposed: false, effect: "hidden-hand" }
      }
    })).toBe(false);
  });

  it("hides empty protocol-banned points from the banned player's target preview only while empty", () => {
    const game = {
      phase: GAME_PHASES.playing,
      turn: COLORS.white,
      skillUses: { white: 1 }
    };
    const protocolPoint = {
      valid: true,
      stone: null,
      protocolBan: { owner: COLORS.black, bannedColor: COLORS.white, effect: "protocol-takeover" }
    };

    expect(canPreviewSkillTarget({
      game,
      player: { color: COLORS.white, character: { skill: { effectType: "hidden-hand" } } },
      point: protocolPoint
    })).toBe(false);

    expect(canPreviewSkillTarget({
      game: { ...game, turn: COLORS.black, skillUses: { black: 1 } },
      player: { color: COLORS.black, character: { skill: { effectType: "hidden-hand" } } },
      point: protocolPoint
    })).toBe(true);

    expect(canPreviewSkillTarget({
      game,
      player: { color: COLORS.white, character: { skill: { effectType: "flip-stone", targetRule: "stone" } } },
      point: { ...protocolPoint, stone: COLORS.black }
    })).toBe(true);
  });
});
