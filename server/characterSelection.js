import { CHARACTERS } from "../src/shared/characters.js";

export function resolveSelectedCharacter(selectedCharacter, dbCharacters = {}, disabledSlugs = new Set()) {
  const selected = typeof selectedCharacter === "string" ? selectedCharacter : "";
  if (dbCharacters[selected]) {
    return {
      characterId: selected,
      characterConfig: dbCharacters[selected]
    };
  }
  if (!disabledSlugs.has(selected) && CHARACTERS[selected]) {
    return {
      characterId: selected,
      characterConfig: CHARACTERS[selected]
    };
  }
  return {
    characterId: "sigrika",
    characterConfig: dbCharacters.sigrika ?? CHARACTERS.sigrika
  };
}
