export { ACTIVE_SKILL_EFFECT_TYPES } from "./skillEffectCatalog.js";

export function skillConsumesTurn(skill) {
  return !skill?.freeTurn;
}

export function activeSkillEffectType(skill) {
  return skill?.effectType ?? "";
}

export function executeRegisteredSkill({ state, color, targetId, skill, handlers }) {
  const handler = handlers?.[activeSkillEffectType(skill)];
  if (!handler) return null;
  return handler({ state, color, targetId, skill });
}
