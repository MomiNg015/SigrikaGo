import { canonicalCharacterId } from "./characterAliases.js";

export function matchCharacterStorageKey(user) {
  return `sigrika-match-characters:${user.id ?? user.username}`;
}

export function readMatchCharacters(user) {
  try {
    const value = JSON.parse(localStorage.getItem(matchCharacterStorageKey(user)));
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

// The local user's identity follows regular Spark, not a battle or mode-specific character.
// Remote profiles use the account selection published by the server.
export function studentIdentityCharacterId(user, { regularSelection, availableIds, self = false } = {}) {
  const regular = regularSelection ?? (self ? readMatchCharacters(user).regular : undefined);
  if (self || regularSelection !== undefined) {
    const ids = Array.isArray(regular) ? regular : [];
    const owned = user.ownedCharacters?.map(canonicalCharacterId);
    return ids.map(canonicalCharacterId).find((id) => id
      && (!availableIds || availableIds.has(id))
      && (!owned || owned.includes(id))
      && !(id === "sigrika" && user.itemEffects?.sigrikaCandyDisabled)) ?? "sigrika";
  }
  return canonicalCharacterId(user.selectedCharacter ?? user.characterId) || "sigrika";
}
