import { describe, expect, it } from "vitest";
import { TUTORIAL_NODE_TYPES } from "../shared/tutorialNodeTypes.js";
import {
  GUIDED_POINT_WARNING,
  UNGUIDED_WRONG_MOVE_FEEDBACK_DELAY_MS,
  tutorialTargetPointForNode,
  tutorialWrongPointWarning,
  unguidedWrongMoveFeedbackAdvance
} from "./tutorialPointGuidance.js";

describe("tutorial point guidance", () => {
  it("uses the yellow-ring instruction for guided move and skill targets", () => {
    const move = {
      type: TUTORIAL_NODE_TYPES.playerMove,
      pointId: "3,4",
      targetHighlightEnabled: true,
      wrongClickMessage: "旧提示"
    };
    const skill = { type: TUTORIAL_NODE_TYPES.playerSkill, pointId: "5,6" };

    expect(tutorialTargetPointForNode(move, "")).toBe("3,4");
    expect(tutorialWrongPointWarning(move, "", "运行时错误")).toBe(GUIDED_POINT_WARNING);
    expect(tutorialTargetPointForNode(skill, "skill-board")).toBe("5,6");
    expect(tutorialWrongPointWarning(skill, "skill-board", "运行时错误")).toBe(GUIDED_POINT_WARNING);
  });

  it("preserves authored feedback when the move target is intentionally hidden", () => {
    const move = {
      type: TUTORIAL_NODE_TYPES.playerMove,
      pointId: "3,4",
      targetHighlightEnabled: false,
      wrongClickMessage: "再想想？"
    };

    expect(tutorialTargetPointForNode(move, "")).toBe("");
    expect(tutorialWrongPointWarning(move, "")).toBe("再想想？");
    expect(tutorialWrongPointWarning(move, "", "规则不允许这样落子")).toBe("规则不允许这样落子");
  });

  it("forces hidden-target wrong-move NPC feedback to wait 1.5 seconds and continue automatically", () => {
    const legacyManualFeedback = {
      type: TUTORIAL_NODE_TYPES.npcDialogue,
      manualContinueEnabled: true,
      autoContinueEnabled: false,
      autoContinueDelaySeconds: 0
    };

    expect(unguidedWrongMoveFeedbackAdvance(legacyManualFeedback, true)).toEqual({
      delayMs: UNGUIDED_WRONG_MOVE_FEEDBACK_DELAY_MS,
      controls: { manualContinue: false, autoContinue: true, revealsChoices: false }
    });
    expect(UNGUIDED_WRONG_MOVE_FEEDBACK_DELAY_MS).toBe(1500);
    expect(unguidedWrongMoveFeedbackAdvance(legacyManualFeedback, false)).toBeNull();
    expect(unguidedWrongMoveFeedbackAdvance({ type: TUTORIAL_NODE_TYPES.npcMove }, true)).toBeNull();
  });
});
