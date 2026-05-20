import { CHARACTERS } from "../src/shared/characters.js";

export function skillConfigForCharacter(character) {
  if (character?.skill?.effectType) return character.skill;
  const fallback = CHARACTERS[character?.id ?? character];
  if (!fallback) return null;
  const targetRule = fallback.skill.id === "flip-stone"
    ? "stone"
    : fallback.skill.id === "random-blast"
      ? "none"
      : fallback.skill.id === "color-illusion-passive"
        ? "none"
        : "empty-point";
  return {
    effectType: fallback.skill.id,
    name: fallback.skill.name,
    uses: fallback.skill.uses ?? 1,
    freeTurn: Boolean(fallback.skill.freeTurn),
    costType: fallback.skill.costType ?? "numeric",
    costValue: String(fallback.skill.costValue ?? fallback.skill.cost ?? 0),
    systemMessage: fallback.skill.systemMessage,
    targetRule,
    params: fallback.skill.params ?? {}
  };
}
