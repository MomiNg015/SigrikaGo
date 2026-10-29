import { TUTORIAL_NODE_TYPES as TYPES } from "../shared/tutorialNodeTypes.js";

export function tutorialActionForNode(node) {
  if (node?.type === TYPES.playerSkill) return "skill";
  if (node?.actor !== "player") return "";
  return ({
    [TYPES.pass]: "pass", [TYPES.draw]: "draw", [TYPES.resign]: "resign",
    [TYPES.countingStart]: "counting", [TYPES.countingConfirm]: "counting"
  })[node.type] || "";
}

export function activeTutorialAction({ node, phase, pendingWait, loading, choicesVisible, confirmExit }) {
  if (loading || pendingWait || choicesVisible || confirmExit) return "";
  return ["skill-button", "button"].includes(phase) ? tutorialActionForNode(node) : "";
}
