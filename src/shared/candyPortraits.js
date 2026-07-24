import { canonicalCharacterId } from "./characterAliases.js";
import { DENIA_CANDY_PORTRAIT_ASSET } from "./characterPortraitAssetCatalog.js";

export const DENIA_CANDY_PORTRAIT = DENIA_CANDY_PORTRAIT_ASSET.url;

export function resolveCandyPortrait(character = {}, itemEffects = {}) {
  if (canonicalCharacterId(character.id) === "denia" && itemEffects?.deniaRainbowGlow) {
    return DENIA_CANDY_PORTRAIT;
  }
  return character.portrait;
}
