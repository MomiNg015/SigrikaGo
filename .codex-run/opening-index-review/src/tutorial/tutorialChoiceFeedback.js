export const TUTORIAL_CHOICE_FEEDBACK = Object.freeze({
  correct: "correct",
  wrong: "wrong"
});

export function tutorialChoiceFeedback(node, selectedOption, nodesById) {
  const options = Array.isArray(node?.options) ? node.options : [];
  if (options.length < 2) return "";

  const retryingOptions = options.map((option) => optionRetriesNode(node, option, nodesById));
  if (!retryingOptions.some(Boolean)) return "";

  return optionRetriesNode(node, selectedOption, nodesById)
    ? TUTORIAL_CHOICE_FEEDBACK.wrong
    : TUTORIAL_CHOICE_FEEDBACK.correct;
}

export function tutorialChoiceRetryFeedbackNode(node, selectedOption, nodesById) {
  if (tutorialChoiceFeedback(node, selectedOption, nodesById) !== TUTORIAL_CHOICE_FEEDBACK.wrong) return null;
  const questionId = String(node?.id ?? "").trim();
  const targetId = String(selectedOption?.nextNodeId ?? "").trim();
  if (!targetId || targetId === questionId) return null;
  const feedbackNode = nodesById?.get?.(targetId) ?? null;
  return String(feedbackNode?.nextNodeId ?? "").trim() === questionId ? feedbackNode : null;
}

function optionRetriesNode(node, option, nodesById) {
  const questionId = String(node?.id ?? "").trim();
  const targetId = String(option?.nextNodeId ?? "").trim();
  if (!questionId || !targetId) return false;
  if (targetId === questionId) return true;
  return String(nodesById?.get?.(targetId)?.nextNodeId ?? "").trim() === questionId;
}
