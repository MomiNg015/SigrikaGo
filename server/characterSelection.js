import { CHARACTERS } from "../src/shared/characters.js";

export function resolveSelectedCharacter(selectedCharacter, dbCharacters = {}, disabledSlugs = new Set(), ownedCharacters = null) {
  const selected = typeof selectedCharacter === "string" ? selectedCharacter : "";
  const disabled = disabledSlugs instanceof Set ? disabledSlugs : new Set(disabledSlugs);
  const owned = Array.isArray(ownedCharacters) ? new Set(ownedCharacters) : null;
  if (!disabled.has(selected) && (!owned || owned.has(selected)) && dbCharacters[selected]) {
    return {
      characterId: selected,
      characterConfig: dbCharacters[selected]
    };
  }
  if (!disabled.has(selected) && (!owned || owned.has(selected)) && CHARACTERS[selected]) {
    return {
      characterId: selected,
      characterConfig: CHARACTERS[selected]
    };
  }
  for (const [characterId, characterConfig] of Object.entries(dbCharacters)) {
    if (!disabled.has(characterId) && (!owned || owned.has(characterId))) return { characterId, characterConfig };
  }
  for (const [characterId, characterConfig] of Object.entries(CHARACTERS)) {
    if (!disabled.has(characterId) && (!owned || owned.has(characterId))) return { characterId, characterConfig };
  }
  return {
    characterId: "sigrika",
    characterConfig: dbCharacters.sigrika ?? CHARACTERS.sigrika
  };
}
