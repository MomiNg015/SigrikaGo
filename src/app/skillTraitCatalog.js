import { api } from "../api/client.js";
import { DEFAULT_SKILL_TRAITS } from "../shared/skillTraits.js";

let cachedCatalogPromise = null;
let cachedCatalogSnapshot = DEFAULT_SKILL_TRAITS;
let retryTimer = null;
const catalogListeners = new Set();

export async function loadPublicSkillTraitCatalog({ apiClient = api } = {}) {
  const data = await apiClient("/api/skill-traits");
  return Array.isArray(data?.traits) ? data.traits : [];
}

export function loadCachedPublicSkillTraitCatalog({ retryDelayMs = 1000, ...options } = {}) {
  if (!cachedCatalogPromise) {
    cachedCatalogPromise = loadPublicSkillTraitCatalog(options)
      .then((traits) => {
        cachedCatalogSnapshot = traits;
        clearRetryTimer();
        for (const listener of catalogListeners) listener();
        return traits;
      })
      .catch((error) => {
        cachedCatalogPromise = null;
        scheduleCatalogRetry({ ...options, retryDelayMs });
        throw error;
      });
  }
  return cachedCatalogPromise;
}

export function getSkillTraitCatalogSnapshot() {
  return cachedCatalogSnapshot;
}

export function subscribeSkillTraitCatalog(listener) {
  catalogListeners.add(listener);
  return () => {
    catalogListeners.delete(listener);
    if (catalogListeners.size === 0) clearRetryTimer();
  };
}

export function resetSkillTraitCatalogCacheForTests() {
  cachedCatalogPromise = null;
  cachedCatalogSnapshot = DEFAULT_SKILL_TRAITS;
  clearRetryTimer();
}

function scheduleCatalogRetry(options) {
  if (catalogListeners.size === 0 || retryTimer || typeof globalThis.setTimeout !== "function") return;
  retryTimer = globalThis.setTimeout(() => {
    retryTimer = null;
    loadCachedPublicSkillTraitCatalog(options).catch(() => {});
  }, options.retryDelayMs);
}

function clearRetryTimer() {
  if (!retryTimer || typeof globalThis.clearTimeout !== "function") return;
  globalThis.clearTimeout(retryTimer);
  retryTimer = null;
}
