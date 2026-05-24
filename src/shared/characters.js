import { FALLBACK_CHARACTERS, fallbackCharacterList } from "./characterFallback.js";
import { canonicalCharacterId } from "./characterAliases.js";

export const CHARACTERS = FALLBACK_CHARACTERS;
export const characterList = fallbackCharacterList;

export function mergeCharacters(apiCharacters = [], disabledSlugs = []) {
  const disabled = new Set((Array.isArray(disabledSlugs) ? disabledSlugs : []).map(canonicalCharacterId));
  const merged = Object.fromEntries(
    Object.entries(CHARACTERS)
      .map(([slug, character]) => [canonicalCharacterId(slug), { ...character, id: canonicalCharacterId(character.id) }])
      .filter(([slug]) => !disabled.has(slug))
  );
  if (!Array.isArray(apiCharacters)) return merged;

  const canonicalApiIds = new Set(
    apiCharacters
      .map((raw) => raw?.id)
      .filter((id) => id && canonicalCharacterId(id) === id)
  );

  for (const raw of apiCharacters) {
    if (!raw?.id) continue;
    const characterId = canonicalCharacterId(raw.id);
    if (disabled.has(characterId)) continue;
    if (raw.id !== characterId && canonicalApiIds.has(characterId)) continue;
    const fallback = CHARACTERS[raw.id] ?? CHARACTERS[characterId] ?? (characterId === "denia" ? CHARACTERS.danea : null) ?? CHARACTERS.sigrika;
    merged[characterId] = {
      ...fallback,
      ...raw,
      id: characterId,
      name: raw.name || fallback.name,
      palette: raw.palette || fallback.palette,
      portrait: raw.portrait || fallback.portrait,
      acquisitionMethod: raw.acquisitionMethod ?? fallback.acquisitionMethod ?? "",
      skill: {
        ...fallback.skill,
        ...(raw.skill ?? {})
      }
    };
  }

  return merged;
}
