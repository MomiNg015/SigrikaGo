import { CHARACTERS } from "../src/shared/characters.js";
import { canonicalCharacterId } from "../src/shared/characterAliases.js";

export function resolveSelectedCharacter(selectedCharacter, dbCharacters = {}, disabledSlugs = new Set(), ownedCharacters = null, blockedCharacters = new Set()) {
  const selected = canonicalCharacterId(typeof selectedCharacter === "string" ? selectedCharacter : "");
  const disabled = new Set([...(disabledSlugs instanceof Set ? disabledSlugs : new Set(disabledSlugs))].map(canonicalCharacterId));
  const blocked = new Set([...(blockedCharacters instanceof Set ? blockedCharacters : new Set(blockedCharacters))].map(canonicalCharacterId));
  const owned = Array.isArray(ownedCharacters) ? new Set(ownedCharacters.map(canonicalCharacterId)) : null;
  if (!blocked.has(selected) && (!owned || owned.has(selected)) && dbCharacters[selected]) {
    return {
      characterId: selected,
      characterConfig: dbCharacters[selected]
    };
  }
  const fallback = CHARACTERS[selected] ?? (selected === "denia" ? CHARACTERS.danea : null);
  if (!blocked.has(selected) && !disabled.has(selected) && (!owned || owned.has(selected)) && fallback) {
    return {
      characterId: selected,
      characterConfig: { ...fallback, id: selected }
    };
  }
  for (const [characterId, characterConfig] of Object.entries(dbCharacters)) {
    const canonicalId = canonicalCharacterId(characterId);
    if (!blocked.has(canonicalId) && !disabled.has(canonicalId) && (!owned || owned.has(canonicalId))) return { characterId: canonicalId, characterConfig: { ...characterConfig, id: canonicalId } };
  }
  for (const [characterId, characterConfig] of Object.entries(CHARACTERS)) {
    const canonicalId = canonicalCharacterId(characterId);
    if (!blocked.has(canonicalId) && !disabled.has(canonicalId) && (!owned || owned.has(canonicalId))) return { characterId: canonicalId, characterConfig: { ...characterConfig, id: canonicalId } };
  }
  return {
    characterId: "sigrika",
    characterConfig: dbCharacters.sigrika ?? CHARACTERS.sigrika
  };
}
