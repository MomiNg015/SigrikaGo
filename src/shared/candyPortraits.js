import { canonicalCharacterId } from "./characterAliases.js";

export const DENIA_CANDY_PORTRAIT = "/assets/characters/denia_color.webp";

export function resolveCandyPortrait(character = {}, itemEffects = {}) {
  if (canonicalCharacterId(character.id) === "denia" && itemEffects?.deniaRainbowGlow) {
    return DENIA_CANDY_PORTRAIT;
  }
  return character.portrait;
}
