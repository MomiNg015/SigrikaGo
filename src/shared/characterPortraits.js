import { canonicalCharacterId } from "./characterAliases.js";
import { DENIA_CANDY_PORTRAIT } from "./candyPortraits.js";

export function resolveCharacterPortrait(character = {}, {
  itemEffects = {},
  user = null,
  equippedCostumes = null,
  costumeSnapshot = null
} = {}) {
  const characterId = canonicalCharacterId(character.id ?? character.slug);
  const costume = costumeSnapshot
    ?? equippedCostumes?.[characterId]
    ?? user?.equippedCostumes?.[characterId]
    ?? null;

  if (characterId === "denia" && itemEffects?.deniaRainbowGlow) {
    return costume?.candyEffectPortraitUrl || DENIA_CANDY_PORTRAIT;
  }
  return costume?.portraitUrl
    || character.portraitUrl
    || character.portrait
    || "";
}
