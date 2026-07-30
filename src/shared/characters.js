import { FALLBACK_CHARACTERS, fallbackCharacterList } from "./characterFallback.js";
import { canonicalCharacterId } from "./characterAliases.js";

export const CHARACTERS = FALLBACK_CHARACTERS;
export const characterList = fallbackCharacterList;

const fallbackCharacterOrder = new Map(
  fallbackCharacterList.map((character, index) => [canonicalCharacterId(character.id), index])
);

export function characterListFromCatalog(catalog = CHARACTERS) {
  return Object.values(catalog ?? {}).sort(compareCharactersForDisplay);
}

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
    const fallback = CHARACTERS[raw.id] ?? CHARACTERS[characterId] ?? CHARACTERS.sigrika;
    merged[characterId] = {
      ...fallback,
      ...raw,
      id: characterId,
      name: raw.name || fallback.name,
      description: String(raw.description ?? "").trim() || fallback.description || "",
      palette: raw.palette || fallback.palette,
      portrait: raw.portrait || fallback.portrait,
      acquisitionMethod: raw.acquisitionMethod ?? fallback.acquisitionMethod ?? "",
      cvName: raw.cvName ?? fallback.cvName ?? "",
      cvUrl: raw.cvUrl ?? fallback.cvUrl ?? "",
      illustName: raw.illustName ?? fallback.illustName ?? "",
      illustUrl: raw.illustUrl ?? fallback.illustUrl ?? "",
      skill: {
        ...fallback.skill,
        ...(raw.skill ?? {})
      }
    };
  }

  return merged;
}

function compareCharactersForDisplay(a, b) {
  const explicitSortDifference = Number(hasDisplaySortOrder(b)) - Number(hasDisplaySortOrder(a));
  if (explicitSortDifference !== 0) return explicitSortDifference;
  const bySortOrder = displaySortOrder(a) - displaySortOrder(b);
  if (bySortOrder !== 0) return bySortOrder;
  const byFallbackOrder = fallbackOrder(a) - fallbackOrder(b);
  if (byFallbackOrder !== 0) return byFallbackOrder;
  return String(a?.id ?? "").localeCompare(String(b?.id ?? ""));
}

function displaySortOrder(character) {
  const value = Number(character?.sortOrder);
  return Number.isFinite(value) ? value : fallbackOrder(character);
}

function hasDisplaySortOrder(character) {
  return Number.isFinite(Number(character?.sortOrder));
}

function fallbackOrder(character) {
  const id = canonicalCharacterId(character?.id);
  return fallbackCharacterOrder.get(id) ?? fallbackCharacterOrder.size;
}
