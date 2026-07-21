import { TUTORIAL_NODE_TYPES } from "../shared/tutorialNodeTypes.js";

export const GUIDED_POINT_WARNING = "请落子或选择黄圈位置";
export const UNGUIDED_WRONG_MOVE_FEEDBACK_DELAY_MS = 1500;

export function tutorialTargetPointForNode(node, phase) {
  if (node?.type === TUTORIAL_NODE_TYPES.playerMove && node.targetHighlightEnabled !== false) {
    return node.pointId || "";
  }
  if (node?.type === TUTORIAL_NODE_TYPES.playerSkill && phase === "skill-board") {
    return node.pointId || "";
  }
  return "";
}

export function tutorialWrongPointWarning(node, phase, fallback = "") {
  if (tutorialTargetPointForNode(node, phase)) return GUIDED_POINT_WARNING;
  return fallback || node?.wrongClickMessage || "请在提示区域落子";
}

export function unguidedWrongMoveFeedbackAdvance(node, active) {
  if (!active || node?.type !== TUTORIAL_NODE_TYPES.npcDialogue) return null;
  return {
    delayMs: UNGUIDED_WRONG_MOVE_FEEDBACK_DELAY_MS,
    controls: { manualContinue: false, autoContinue: true, revealsChoices: false }
  };
}
