import { canonicalCharacterId } from "../shared/characterAliases.js";
import { CHARACTERS } from "../shared/characters.js";
import { preloadImageAssets } from "../shared/preloadAssets.js";
import { preloadCharacterCandidates } from "./preloadCharacterCatalog.js";

const AUTH_PORTRAIT_PREWARM_PRIORITY = new Map([
  ["sigrika", 0],
  ["denia", 1]
]);
const DEFAULT_AUTH_PORTRAIT_PREWARM_CONCURRENCY = 2;
const DEFAULT_AUTH_PORTRAIT_PREWARM_TIMEOUT_MS = 8000;

const readyPortraitSources = new Set();
const readyListeners = new Set();
let activePrewarmPromise = null;
let readyVersion = 0;

export function authPortraitPrewarmSources(characters = CHARACTERS) {
  return preloadCharacterCandidates(characters)
    .map((character, index) => ({
      character,
      index,
      priority: AUTH_PORTRAIT_PREWARM_PRIORITY.get(canonicalCharacterId(character?.id)) ?? 2
    }))
    .sort((left, right) => left.priority - right.priority || left.index - right.index)
    .map(({ character }) => character.portrait);
}

export function prewarmAuthPortraits({
  characters = CHARACTERS,
  concurrency = DEFAULT_AUTH_PORTRAIT_PREWARM_CONCURRENCY,
  preloadImages = preloadImageAssets,
  taskTimeoutMs = DEFAULT_AUTH_PORTRAIT_PREWARM_TIMEOUT_MS
} = {}) {
  if (activePrewarmPromise) return activePrewarmPromise;

  const sources = authPortraitPrewarmSources(characters)
    .filter((source) => !readyPortraitSources.has(source));
  if (sources.length === 0) return Promise.resolve(authPortraitReadySources());

  let trackedPromise;
  trackedPromise = Promise.resolve()
    .then(() => preloadImages(sources, {
      concurrency,
      onLoaded: markAuthPortraitReady,
      taskTimeoutMs
    }))
    .catch(() => null)
    .then(() => authPortraitReadySources())
    .finally(() => {
      if (activePrewarmPromise === trackedPromise) activePrewarmPromise = null;
    });
  activePrewarmPromise = trackedPromise;
  return trackedPromise;
}

export function authPortraitReadySources() {
  return new Set(readyPortraitSources);
}

export function authPortraitReadyVersion() {
  return readyVersion;
}

export function subscribeAuthPortraitReady(listener) {
  readyListeners.add(listener);
  return () => readyListeners.delete(listener);
}

export function resetAuthPortraitPrewarmForTests() {
  activePrewarmPromise = null;
  readyPortraitSources.clear();
  readyVersion = 0;
}

function markAuthPortraitReady(source) {
  if (!source || readyPortraitSources.has(source)) return;
  readyPortraitSources.add(source);
  readyVersion += 1;
  readyListeners.forEach((listener) => listener());
}
