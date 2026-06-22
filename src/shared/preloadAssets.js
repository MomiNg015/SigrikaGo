import { preloadEffectSound } from "../audio/playback.jsx";
import {
  CHARACTER_SYSTEM_VOICES,
  CHARACTER_SKILL_VOICES,
  MATCH_SUCCESS_SOUND,
  MUSIC_TYPES,
  MUSIC_TRACKS,
  VICTORY_SOUND,
  DEFEAT_SOUND,
  resolveSkillMusicTrack
} from "./musicLibrary.js";
import { RUNTIME_AUDIO_ASSETS, RUNTIME_IMAGE_ASSETS } from "./assetRegistry.js";
import { STONE_DECORATIONS } from "./stoneDecorations.js";
import { CHARACTERS } from "./characters.js";
import { canonicalCharacterId } from "./characterAliases.js";
import { voiceSourceCandidates } from "./systemVoices.js";

export function deploymentSocketBase(locationLike = globalThis.location) {
  return locationLike?.origin ?? "";
}

export function playbackAssetSources(playback) {
  if (!playback) return [];
  if (playback.mode === "intro-loop") return compactUnique([playback.introSrc, playback.loopSrc]);
  return compactUnique([playback.src]);
}

export function loginPreloadAssets({
  characters = {},
  tracks = MUSIC_TRACKS,
  skillVoices = CHARACTER_SKILL_VOICES,
  systemVoices = CHARACTER_SYSTEM_VOICES
} = {}) {
  const criticalImages = compactUnique([
    ...Object.values(characters).map((character) => character?.portrait),
    ...RUNTIME_IMAGE_ASSETS.home
  ]);
  const deferredImages = compactUnique([
    ...RUNTIME_IMAGE_ASSETS.shop,
    ...RUNTIME_IMAGE_ASSETS.effects,
    ...Object.values(STONE_DECORATIONS).flatMap((decoration) => [
      decoration.previewImageUrl,
      decoration.images?.black,
      decoration.images?.white
    ])
  ]);
  const images = compactUnique([...criticalImages, ...deferredImages]);

  const criticalAudio = compactUnique(RUNTIME_AUDIO_ASSETS.interaction);
  const deferredAudio = compactUnique([
    MATCH_SUCCESS_SOUND,
    VICTORY_SOUND,
    DEFEAT_SOUND,
    ...Object.values(tracks).flatMap((track) => playbackAssetSources(track?.playback)),
    ...Object.values(skillVoices).flatMap(voiceSourceCandidates),
    ...Object.values(systemVoices).flatMap((voiceMap) => Object.values(voiceMap ?? {}).flatMap(voiceSourceCandidates))
  ]);
  const audio = compactUnique([...criticalAudio, ...deferredAudio]);

  return { criticalImages, deferredImages, images, criticalAudio, deferredAudio, audio };
}

export function battlePreloadAssets({
  room = null,
  characters = CHARACTERS,
  tracks = MUSIC_TRACKS,
  skillVoices = CHARACTER_SKILL_VOICES,
  systemVoices = CHARACTER_SYSTEM_VOICES
} = {}) {
  const players = room?.players ?? [];
  const characterIds = compactUnique(players.map((player) => canonicalCharacterId(
    player.character?.id ?? player.characterId
  )));
  const roomCharacters = characterIds
    .map((characterId) => characters?.[characterId] ?? CHARACTERS[characterId])
    .filter(Boolean);
  const skillTracks = characterIds
    .map((characterId) => resolveSkillMusicTrack({ characterId, tracks }))
    .filter(Boolean);
  const battleTracks = Object.values(tracks ?? {}).filter((track) => track?.type === MUSIC_TYPES.battle);

  const criticalImages = compactUnique([
    ...roomCharacters.map((character) => character?.portrait),
    ...RUNTIME_IMAGE_ASSETS.effects
  ]);
  const criticalAudio = compactUnique([
    MATCH_SUCCESS_SOUND,
    ...RUNTIME_AUDIO_ASSETS.interaction,
    ...battleTracks.flatMap((track) => playbackAssetSources(track.playback)),
    ...skillTracks.flatMap((track) => playbackAssetSources(track.playback)),
    ...characterIds.flatMap((characterId) => voiceSourceCandidates(skillVoices?.[characterId])),
    ...characterIds.flatMap((characterId) => Object.values(systemVoices?.[characterId] ?? {}).flatMap(voiceSourceCandidates))
  ]);

  return {
    criticalImages,
    deferredImages: [],
    images: criticalImages,
    criticalAudio,
    deferredAudio: [],
    audio: criticalAudio
  };
}

export async function preloadLoginAssets(assets, {
  concurrency = 6,
  loadAudio = preloadFetch,
  loadEffectAudio = preloadEffectSound,
  loadImage = preloadImage,
  onProgress = () => {},
  taskTimeoutMs = 8000
} = {}) {
  const groups = normalizePreloadAssetGroups(assets);
  const decodedEffects = new Set(RUNTIME_AUDIO_ASSETS.interaction);
  const criticalTasks = createPreloadTasks(groups.criticalImages, groups.criticalAudio, {
    decodedEffects,
    loadAudio,
    loadEffectAudio,
    loadImage
  });
  const deferredTasks = createPreloadTasks(groups.deferredImages, groups.deferredAudio, {
    decodedEffects,
    loadAudio,
    loadEffectAudio,
    loadImage
  });
  if (criticalTasks.length === 0) {
    onProgress(1);
  } else {
    let completed = 0;
    await runPreloadTasks(criticalTasks, {
      concurrency,
      taskTimeoutMs,
      onComplete: () => {
        completed += 1;
        onProgress(completed / criticalTasks.length);
      }
    });
  }
  void runPreloadTasks(deferredTasks, { concurrency, taskTimeoutMs });
}

function preloadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      resolve(null);
      return;
    }
    const image = new Image();
    image.onload = () => resolve(src);
    image.onerror = reject;
    image.decoding = "async";
    image.src = src;
  });
}

async function preloadFetch(src) {
  if (!src) return null;
  const response = await fetch(src, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Failed to preload ${src}`);
  return response.arrayBuffer();
}

function compactUnique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizePreloadAssetGroups(assets = {}) {
  const hasGroupedAssets = Array.isArray(assets.criticalImages)
    || Array.isArray(assets.deferredImages)
    || Array.isArray(assets.criticalAudio)
    || Array.isArray(assets.deferredAudio);
  if (!hasGroupedAssets) {
    return {
      criticalImages: compactUnique(assets.images ?? []),
      deferredImages: [],
      criticalAudio: compactUnique(assets.audio ?? []),
      deferredAudio: []
    };
  }
  return {
    criticalImages: compactUnique(assets.criticalImages ?? []),
    deferredImages: compactUnique(assets.deferredImages ?? []),
    criticalAudio: compactUnique(assets.criticalAudio ?? []),
    deferredAudio: compactUnique(assets.deferredAudio ?? [])
  };
}

function createPreloadTasks(images, audio, { decodedEffects, loadAudio, loadEffectAudio, loadImage }) {
  return [
    ...images.map((src) => () => loadImage(src)),
    ...audio.map((src) => () => decodedEffects.has(src) ? loadEffectAudio(src) : loadAudio(src))
  ];
}

async function runPreloadTasks(tasks, { concurrency = 6, onComplete = () => {}, taskTimeoutMs = 8000 } = {}) {
  if (tasks.length === 0) return;
  const workerCount = Math.max(1, Math.min(Number(concurrency) || 1, tasks.length));
  let nextIndex = 0;
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (nextIndex < tasks.length) {
      const task = tasks[nextIndex];
      nextIndex += 1;
      const taskPromise = Promise.resolve().then(task).catch(() => null);
      await withTaskTimeout(taskPromise, taskTimeoutMs);
      onComplete();
    }
  }));
}

function withTaskTimeout(promise, timeoutMs) {
  const timeout = Number(timeoutMs);
  if (!Number.isFinite(timeout) || timeout <= 0) return promise;

  let timeoutId;
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => resolve(null), timeout);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}
