import { FALLBACK_CHARACTERS, fallbackCharacterList } from "./characterFallback.js";

export const CHARACTERS = FALLBACK_CHARACTERS;
export const characterList = fallbackCharacterList;

export function mergeCharacters(apiCharacters = []) {
  const merged = { ...CHARACTERS };
  if (!Array.isArray(apiCharacters)) return merged;

  for (const raw of apiCharacters) {
    if (!raw?.id) continue;
    const fallback = CHARACTERS[raw.id] ?? CHARACTERS.sigrika;
    merged[raw.id] = {
      ...fallback,
      ...raw,
      name: raw.name || fallback.name,
      palette: raw.palette || fallback.palette,
      portrait: raw.portrait || fallback.portrait,
      skill: {
        ...fallback.skill,
        ...(raw.skill ?? {})
      }
    };
  }

  return merged;
}
