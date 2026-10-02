import { AUTHORED_GUIDE_EXPRESSIONS } from "./authoredGuideExpressionsData.js";
import { storySpriteProfile } from "./characterStorySprites.js";

const groups = {
  "onboarding.default": [...AUTHORED_GUIDE_EXPRESSIONS.onboarding, ...AUTHORED_GUIDE_EXPRESSIONS.legacy],
  "home.onboarding": AUTHORED_GUIDE_EXPRESSIONS.home
};

export function applyAuthoredGuideExpression(node, scriptKey) {
  if (Object.hasOwn(node, "appearanceId") || Object.hasOwn(node, "expressionId")) return node;
  const entry = storySpriteProfile(node.characterId);
  if (!entry) return node;
  const assignment = groups[scriptKey]?.find((candidate) => candidate.nodeId === node.id
    && candidate.characterId === entry.characterId && candidate.sourceText === String(node.text ?? "").trim());
  if (!assignment) return node;
  return { ...node, appearanceId: entry.appearanceId, expressionId: assignment.expressionId };
}

export function applyAuthoredGuideExpressions(nodes, scriptKey) {
  return nodes.map((node) => applyAuthoredGuideExpression(node, scriptKey));
}
