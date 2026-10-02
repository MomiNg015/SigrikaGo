import { CHARACTERS, mergeCharacters } from "../shared/characters.js";
import { api } from "../api/client.js";

export async function loadPublicCharacterCatalog({
  apiClient = api,
  token,
  fallback = CHARACTERS
} = {}) {
  try {
    const data = await apiClient("/api/characters", { token });
    return mergeCharacters(data.characters, data.disabledSlugs);
  } catch {
    return fallback;
  }
}
