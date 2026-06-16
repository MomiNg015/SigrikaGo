import { CHARACTERS } from "./characters.js";
import { canonicalCharacterId } from "./characterAliases.js";
import { skillEffectTargetRule } from "./skillEffectCatalog.js";

export function normalizeSkillConfig(skillOrCharacterId) {
  if (skillOrCharacterId?.effectType) return skillOrCharacterId;
  if (skillOrCharacterId?.id) {
    const effectType = skillOrCharacterId.id;
    return {
      characterId: skillOrCharacterId.characterId ?? null,
      effectType,
      name: skillOrCharacterId.name,
      uses: skillOrCharacterId.uses ?? (effectType === "color-illusion-passive" ? 0 : 1),
      freeTurn: Boolean(skillOrCharacterId.freeTurn),
      costType: skillOrCharacterId.costType ?? "numeric",
      costValue: String(skillOrCharacterId.costValue ?? skillOrCharacterId.cost ?? 0),
      systemMessage: skillOrCharacterId.systemMessage,
      targetRule: skillEffectTargetRule(effectType, "empty-point"),
      params: skillOrCharacterId.params ?? {}
    };
  }
  const characterId = canonicalCharacterId(skillOrCharacterId);
  const fallback = CHARACTERS[characterId];
  if (fallback?.skill?.id === "erase-point") {
    return {
      characterId: fallback.id,
      effectType: "erase-point",
      name: fallback.skill.name,
      uses: fallback.skill.uses ?? 1,
      freeTurn: Boolean(fallback.skill.freeTurn),
      costType: fallback.skill.costType ?? "numeric",
      costValue: String(fallback.skill.costValue ?? fallback.skill.cost ?? 0),
      systemMessage: fallback.skill.systemMessage,
      targetRule: "empty-point",
      params: {}
    };
  }
  if (fallback?.skill?.id === "flip-stone") {
    return {
      characterId: fallback.id,
      effectType: "flip-stone",
      name: fallback.skill.name,
      uses: fallback.skill.uses ?? 1,
      freeTurn: Boolean(fallback.skill.freeTurn),
      costType: fallback.skill.costType ?? "numeric",
      costValue: String(fallback.skill.costValue ?? fallback.skill.cost ?? 0),
      systemMessage: fallback.skill.systemMessage,
      targetRule: "stone",
      params: {}
    };
  }
  if (fallback?.skill?.id === "hidden-hand") {
    return {
      characterId: fallback.id,
      effectType: "hidden-hand",
      name: fallback.skill.name,
      uses: fallback.skill.uses ?? 1,
      freeTurn: false,
      costType: fallback.skill.costType ?? "numeric",
      costValue: String(fallback.skill.costValue ?? fallback.skill.cost ?? 0),
      systemMessage: fallback.skill.systemMessage,
      targetRule: "empty-point",
      params: {}
    };
  }
  if (fallback?.skill?.id === "random-blast") {
    return {
      characterId: fallback.id,
      effectType: "random-blast",
      name: fallback.skill.name,
      uses: fallback.skill.uses ?? 1,
      freeTurn: Boolean(fallback.skill.freeTurn),
      costType: fallback.skill.costType ?? "numeric",
      costValue: String(fallback.skill.costValue ?? fallback.skill.cost ?? 0),
      systemMessage: fallback.skill.systemMessage,
      targetRule: "none",
      params: fallback.skill.params ?? { size: 3 }
    };
  }
  if (fallback?.skill?.id === "row-slash") {
    return {
      characterId: fallback.id,
      effectType: "row-slash",
      name: fallback.skill.name,
      uses: fallback.skill.uses ?? 1,
      freeTurn: Boolean(fallback.skill.freeTurn),
      costType: fallback.skill.costType ?? "numeric",
      costValue: String(fallback.skill.costValue ?? fallback.skill.cost ?? 0),
      systemMessage: fallback.skill.systemMessage,
      targetRule: "any-point",
      params: fallback.skill.params ?? {}
    };
  }
  if (fallback?.skill?.id === "spray-stone") {
    return {
      characterId: fallback.id,
      effectType: "spray-stone",
      name: fallback.skill.name,
      uses: fallback.skill.uses ?? 1,
      freeTurn: Boolean(fallback.skill.freeTurn),
      costType: fallback.skill.costType ?? "numeric",
      costValue: String(fallback.skill.costValue ?? fallback.skill.cost ?? 0),
      systemMessage: fallback.skill.systemMessage,
      targetRule: "stone",
      params: fallback.skill.params ?? {}
    };
  }
  if (fallback?.skill?.id === "color-illusion-passive") {
    return {
      characterId: fallback.id,
      effectType: "color-illusion-passive",
      name: fallback.skill.name,
      uses: fallback.skill.uses ?? 0,
      freeTurn: true,
      costType: fallback.skill.costType ?? "numeric",
      costValue: String(fallback.skill.costValue ?? fallback.skill.cost ?? 0),
      systemMessage: fallback.skill.systemMessage,
      targetRule: "none",
      params: fallback.skill.params ?? { probability: 0.8 }
    };
  }
  return null;
}

export function skillRequiresExistingStone(skillOrCharacterId) {
  const skill = normalizeSkillConfig(skillOrCharacterId);
  const effectType = skill?.effectType ?? skill?.id;
  const targetRule = skill?.targetRule ?? skillEffectTargetRule(effectType, "empty-point");
  return targetRule === "stone" || effectType === "random-blast";
}

export function skillUsesBoardConfirmation(skillOrCharacterId) {
  const skill = normalizeSkillConfig(skillOrCharacterId);
  const effectType = skill?.effectType ?? skill?.id;
  return effectType === "random-blast";
}
