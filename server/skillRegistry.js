import { CHARACTERS } from "../src/shared/characters.js";

export function skillConfigForCharacter(character) {
  if (character?.skill?.effectType) return character.skill;
  const fallback = CHARACTERS[character?.id ?? character];
  if (!fallback) return null;
  return {
    effectType: fallback.skill.id,
    name: fallback.skill.name,
    uses: fallback.skill.uses ?? 1,
    freeTurn: Boolean(fallback.skill.freeTurn),
    targetRule: fallback.skill.id === "erase-point" ? "empty-point" : "stone",
    params: {}
  };
}
