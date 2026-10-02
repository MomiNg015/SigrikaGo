export const DEFAULT_SKILL_TRAITS = Object.freeze([
  Object.freeze({
    id: "skill-trait-sprint",
    name: "疾走",
    definition: "发动该技能不消耗当前回合落子。",
    sortOrder: 0
  }),
  Object.freeze({
    id: "skill-trait-no-first",
    name: "禁先",
    definition: "对手尚未在本局成功发动过主动技能时，具有该特性的技能无法发动。",
    sortOrder: 1
  }),
  Object.freeze({
    id: "skill-trait-passive",
    name: "被动",
    definition: "无需玩家主动发动，满足其技能条件时自动生效。",
    sortOrder: 2
  }),
  Object.freeze({
    id: "skill-trait-derived",
    name: "派生",
    definition: "该技能不是角色初始持有的常驻技能，需要由其他技能或对局状态生成后才能使用。",
    sortOrder: 3
  })
]);

export const SKILL_TRAIT_TOKEN_PATTERN = /【([^【】]+)】/g;

export function extractSkillTraitReferences(description) {
  const references = [];
  const text = String(description ?? "");
  for (const match of text.matchAll(SKILL_TRAIT_TOKEN_PATTERN)) {
    references.push(match[1]);
  }
  return references;
}

export function skillTraitMap(traits = []) {
  return new Map(
    (Array.isArray(traits) ? traits : [])
      .filter((trait) => trait?.name && trait?.definition)
      .map((trait) => [String(trait.name), trait])
  );
}

export function formatSkillOverclock(skill = {}) {
  const value = String(skill?.costValue ?? skill?.cost ?? 0).trim() || "0";
  return `超频：${value}`;
}
