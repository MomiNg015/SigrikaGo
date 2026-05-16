import { CHARACTERS } from "../src/shared/characters.js";

export function resolveSelectedCharacter(selectedCharacter, dbCharacters = {}, disabledSlugs = new Set()) {
  const selected = typeof selectedCharacter === "string" ? selectedCharacter : "";
  const disabled = disabledSlugs instanceof Set ? disabledSlugs : new Set(disabledSlugs);
  if (!disabled.has(selected) && dbCharacters[selected]) {
    return {
      characterId: selected,
      characterConfig: dbCharacters[selected]
    };
  }
  if (!disabled.has(selected) && CHARACTERS[selected]) {
    return {
      characterId: selected,
      characterConfig: CHARACTERS[selected]
    };
  }
  for (const [characterId, characterConfig] of Object.entries(dbCharacters)) {
    if (!disabled.has(characterId)) return { characterId, characterConfig };
  }
  for (const [characterId, characterConfig] of Object.entries(CHARACTERS)) {
    if (!disabled.has(characterId)) return { characterId, characterConfig };
  }
  return {
    characterId: "sigrika",
    characterConfig: dbCharacters.sigrika ?? CHARACTERS.sigrika
  };
}
