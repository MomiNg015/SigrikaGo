import { CHARACTERS } from "../src/shared/characters.js";
import { canonicalCharacterId } from "../src/shared/characterAliases.js";
import { blockedCharactersForItemEffects } from "./itemEffects.js";

export function resolveMatchCharacter(user, input, { characters = {}, disabledSlugs = new Set() } = {}) {
  const id = typeof input === "string" ? canonicalCharacterId(input) : "";
  const character = characters[id] ?? CHARACTERS[id];
  const owned = new Set((user.ownedCharacters ?? []).map(canonicalCharacterId));
  const disabled = new Set([...disabledSlugs].map(canonicalCharacterId));
  if (!id || !owned.has(id) || !character || character.enabled === false || disabled.has(id)
    || blockedCharactersForItemEffects(user.itemEffects).has(id) || user.sigrikaCandyArc?.corrupted) {
    return { ok: false, error: "所选角色不可用，请重新选择", code: "invalid_match_character" };
  }
  return { ok: true, user: { ...user, selectedCharacter: id } };
}
