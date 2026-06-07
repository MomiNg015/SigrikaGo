export const ACTIVE_SKILL_EFFECT_TYPES = Object.freeze([
  "erase-point",
  "flip-stone",
  "hidden-hand",
  "random-blast"
]);

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
