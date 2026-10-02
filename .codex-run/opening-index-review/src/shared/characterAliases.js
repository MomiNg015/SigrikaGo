export const CHARACTER_ALIASES = {};

export function canonicalCharacterId(characterId) {
  const id = String(characterId ?? "").trim();
  return CHARACTER_ALIASES[id] ?? id;
}

export function sameCharacterId(a, b) {
  return canonicalCharacterId(a) === canonicalCharacterId(b);
}
