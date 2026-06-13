import { describe, expect, test } from "vitest";
import { SKILL_EFFECT_CATALOG } from "../shared/skillEffectCatalog.js";
import { BOARD_SKILL_EFFECT_RENDERERS, playRegisteredBoardSkillEffect } from "./boardSkillEffectRegistry.js";

describe("boardSkillEffectRegistry", () => {
  test("registers every catalog board effect", () => {
    const boardEffectTypes = Object.entries(SKILL_EFFECT_CATALOG)
      .filter(([, metadata]) => metadata.boardEffect)
      .map(([effectType]) => effectType);

    expect(Object.keys(BOARD_SKILL_EFFECT_RENDERERS).sort()).toEqual(boardEffectTypes.sort());
  });

  test("keeps hidden-hand registered as a full-board effect", () => {
    expect(BOARD_SKILL_EFFECT_RENDERERS["hidden-hand"]).toMatchObject({
      fullBoard: true,
      play: expect.any(Function),
      playReducedMotion: expect.any(Function)
    });
  });

  test("skips unknown effects without touching the Pixi stage", () => {
    const app = { stage: { addChild: () => { throw new Error("should not draw"); } } };

    expect(() => playRegisteredBoardSkillEffect({
      app,
      pixi: {},
      host: { clientWidth: 260, clientHeight: 260 },
      boardSize: 13,
      pendingSkill: { effectType: "unknown-effect", targetId: "6,6" },
      durationMs: 1000,
      reducedMotion: false
    })).not.toThrow();
  });
});
