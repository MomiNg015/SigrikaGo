import { TUTORIAL_NODE_TYPES as TYPES } from "../shared/tutorialNodeTypes.js";

export function tutorialActionForNode(node) {
  if (node?.type === TYPES.playerSkill) return "skill";
  if (node?.actor !== "player") return "";
  return ({
    [TYPES.pass]: "pass", [TYPES.draw]: "draw", [TYPES.resign]: "resign",
    [TYPES.countingStart]: "counting", [TYPES.countingConfirm]: "counting"
  })[node.type] || "";
}

export function tutorialContinueForState({ node, phase, pendingWait, choicesVisible, previewControlsEnabled }) {
  if (choicesVisible && node?.options?.length) {
    const option = node.options[0];
    const label = String(option.label || "继续").trim() || "继续";
    return node.options.length === 1 && ["继续", "立即继续"].includes(label)
      ? { kind: "choice", label, option } : null;
  }
  if (pendingWait) {
    return pendingWait.manualContinue || previewControlsEnabled
      ? { kind: "wait", label: pendingWait.manualContinue ? "继续" : "立即继续" } : null;
  }
  return phase === "continue" ? { kind: "continue", label: "继续" } : null;
}

export function activeTutorialAction(state) {
  const { node, phase, pendingWait, loading, choicesVisible, confirmExit } = state;
  if (loading || confirmExit) return "";
  if (tutorialContinueForState(state)) return "continue";
  if (pendingWait || choicesVisible) return "";
  return ["skill-button", "button"].includes(phase) ? tutorialActionForNode(node) : "";
}
