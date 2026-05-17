import { FALLBACK_CHARACTERS, fallbackCharacterList } from "./characterFallback.js";

export const CHARACTERS = FALLBACK_CHARACTERS;
export const characterList = fallbackCharacterList;

export function mergeCharacters(apiCharacters = [], disabledSlugs = []) {
  const disabled = new Set(Array.isArray(disabledSlugs) ? disabledSlugs : []);
  const merged = Object.fromEntries(
    Object.entries(CHARACTERS).filter(([slug]) => !disabled.has(slug))
  );
  if (!Array.isArray(apiCharacters)) return merged;

  for (const raw of apiCharacters) {
    if (!raw?.id) continue;
    if (disabled.has(raw.id)) continue;
    const fallback = CHARACTERS[raw.id] ?? CHARACTERS.sigrika;
    merged[raw.id] = {
      ...fallback,
      ...raw,
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
