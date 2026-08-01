import { canonicalCharacterId } from "../shared/characterAliases.js";
import { CHARACTERS, characterListFromCatalog } from "../shared/characters.js";

const PRELOAD_EXCLUDED_CHARACTER_IDS = new Set(["baconbits"]);

export function preloadCharacterCandidates(characters = CHARACTERS) {
  return characterListFromCatalog(characters)
    .filter((character) => character?.portrait && !isExcludedPreloadCharacter(character));
}

export function isExcludedPreloadCharacter(character) {
  return PRELOAD_EXCLUDED_CHARACTER_IDS.has(canonicalCharacterId(character?.id));
}
