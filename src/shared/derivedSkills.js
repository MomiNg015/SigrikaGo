import { getPoint } from "./gameBoard.js";
import { skillEffectTargetRule } from "./skillEffectCatalog.js";

export const DERIVED_SKILL_EFFECTS = Object.freeze({
  voyageStar: "voyage-star"
});

export const VOYAGE_STAR_MUSIC_TRACK_ID = "aemeath-voyage-star-default";

export const DEFAULT_VOYAGE_STAR_DERIVED_SKILL = Object.freeze({
  id: DERIVED_SKILL_EFFECTS.voyageStar,
  effectType: DERIVED_SKILL_EFFECTS.voyageStar,
  name: "远航星",
  description: "以“小爱出击”产生的未暴露隐藏手为中心，抹除包括其在内的上下左右1路交叉点；同时移除这些抹除交叉点上下左右1路的棋子。超频5，不消耗落子次数，仅限自己的回合使用。",
  uses: 1,
  freeTurn: true,
  costType: "numeric",
  costValue: "5",
  targetRule: "none",
  musicTrackId: VOYAGE_STAR_MUSIC_TRACK_ID
});

export function derivedSkillDefinitionsFromSkill(skill = {}) {
  if (skill === "aemeath") return [{ ...DEFAULT_VOYAGE_STAR_DERIVED_SKILL }];
  const params = skill?.params && typeof skill.params === "object" ? skill.params : {};
  const rawDefinitions = Array.isArray(params.derivedSkills) ? params.derivedSkills : [];
  const definitions = rawDefinitions
    .map((definition) => normalizeDerivedSkillDefinition(definition))
    .filter(Boolean);
  if (shouldProvideBuiltinVoyageStar(skill, definitions)) {
    definitions.push({ ...DEFAULT_VOYAGE_STAR_DERIVED_SKILL });
  }
  return definitions;
}

export function voyageStarDefinitionFromSkill(skill = {}) {
  return derivedSkillDefinitionsFromSkill(skill).find((definition) => (
    definition.effectType === DERIVED_SKILL_EFFECTS.voyageStar
  )) ?? null;
}

export function createDerivedSkillState(definition, sourceHiddenHandId) {
  if (!definition?.effectType || !sourceHiddenHandId) return null;
  return {
    id: definition.id ?? definition.effectType,
    effectType: definition.effectType,
    name: definition.name,
    description: definition.description ?? "",
    uses: Number.isInteger(definition.uses) ? definition.uses : 1,
    costType: definition.costType ?? "numeric",
    costValue: String(definition.costValue ?? definition.cost ?? 0),
    freeTurn: definition.freeTurn !== false,
    targetRule: definition.targetRule ?? skillEffectTargetRule(definition.effectType, "none"),
    musicTrackId: definition.musicTrackId ?? null,
    sourceEffectType: "hidden-hand",
    sourceHiddenHandId,
    spent: false
  };
}

export function activeDerivedSkillState(game, color) {
  const derived = game?.derivedSkills?.[color];
  return derived?.effectType ? derived : null;
}

export function normalizeDerivedSkillState(derived) {
  if (!derived?.effectType) return null;
  return {
    id: derived.id ?? derived.effectType,
    effectType: derived.effectType,
    name: derived.name ?? DEFAULT_VOYAGE_STAR_DERIVED_SKILL.name,
    description: derived.description ?? "",
    uses: Math.max(0, Math.floor(Number(derived.uses ?? 0)) || 0),
    costType: derived.costType ?? "numeric",
    costValue: String(derived.costValue ?? derived.cost ?? 0),
    freeTurn: derived.freeTurn !== false,
    targetRule: derived.targetRule ?? skillEffectTargetRule(derived.effectType, "none"),
    musicTrackId: derived.musicTrackId ?? null,
    sourceEffectType: derived.sourceEffectType ?? null,
    sourceHiddenHandId: derived.sourceHiddenHandId ?? null,
    spent: Boolean(derived.spent)
  };
}

export function effectiveSkillConfigForPlayer(game, player) {
  if (!player) return player?.character?.skill ?? player?.characterId ?? null;
  return effectiveSkillConfigForColor(game, player.color, player.character?.skill ?? player.skill ?? player.characterId);
}

export function effectiveSkillConfigForColor(game, color, fallbackSkill) {
  const derived = normalizeDerivedSkillState(activeDerivedSkillState(game, color));
  return derived ?? fallbackSkill;
}

export function effectiveSkillUsesForColor(game, color) {
  const derived = normalizeDerivedSkillState(activeDerivedSkillState(game, color));
  if (derived) return derived.uses;
  return game?.skillUses?.[color] ?? 0;
}

export function effectiveSkillDisplayForPlayer(game, player) {
  const derived = normalizeDerivedSkillState(activeDerivedSkillState(game, player?.color));
  if (derived) return derived;
  return player?.character?.skill ?? player?.skill ?? null;
}

export function canUseVoyageStar(game, color) {
  const derived = normalizeDerivedSkillState(activeDerivedSkillState(game, color));
  if (derived?.effectType !== DERIVED_SKILL_EFFECTS.voyageStar || derived.uses <= 0) return false;
  const point = getPoint(game, derived.sourceHiddenHandId);
  return Boolean(
    point?.valid
    && point.stone === color
    && point.hiddenHand
    && point.hiddenHand.owner === color
    && point.hiddenHand.exposed === false
  );
}

export function spentDerivedSkillState(derived) {
  const normalized = normalizeDerivedSkillState(derived);
  if (!normalized) return null;
  return {
    ...normalized,
    uses: 0,
    spent: true,
    sourceHiddenHandId: null
  };
}

function normalizeDerivedSkillDefinition(definition) {
  if (!definition || typeof definition !== "object") return null;
  const effectType = definition.effectType ?? definition.id;
  if (!effectType) return null;
  return {
    ...DEFAULT_VOYAGE_STAR_DERIVED_SKILL,
    ...definition,
    id: definition.id ?? effectType,
    effectType,
    name: String(definition.name ?? DEFAULT_VOYAGE_STAR_DERIVED_SKILL.name).trim() || DEFAULT_VOYAGE_STAR_DERIVED_SKILL.name,
    description: String(definition.description ?? DEFAULT_VOYAGE_STAR_DERIVED_SKILL.description),
    uses: Math.max(0, Math.floor(Number(definition.uses ?? DEFAULT_VOYAGE_STAR_DERIVED_SKILL.uses)) || 0),
    costType: definition.costType === "special" ? "special" : "numeric",
    costValue: String(definition.costValue ?? definition.cost ?? DEFAULT_VOYAGE_STAR_DERIVED_SKILL.costValue),
    targetRule: definition.targetRule ?? skillEffectTargetRule(effectType, "none"),
    freeTurn: definition.freeTurn !== false,
    musicTrackId: definition.musicTrackId ?? (effectType === DERIVED_SKILL_EFFECTS.voyageStar ? VOYAGE_STAR_MUSIC_TRACK_ID : null)
  };
}

function shouldProvideBuiltinVoyageStar(skill, definitions) {
  if (definitions.some((definition) => definition.effectType === DERIVED_SKILL_EFFECTS.voyageStar)) return false;
  return (skill?.characterId === "aemeath" || skill?.id === "hidden-hand" || skill?.effectType === "hidden-hand")
    && skill?.effectType !== "color-illusion-passive";
}
