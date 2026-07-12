import { preloadEffectSound } from "../audio/playback.jsx";
import {
  CHARACTER_SYSTEM_VOICES,
  CHARACTER_SKILL_VOICES,
  MATCH_SUCCESS_SOUND,
  MUSIC_TYPES,
  MUSIC_TRACKS,
  VICTORY_SOUND,
  DEFEAT_SOUND,
  ownedMusicIdsWithDefaults,
  parseMusicIds,
  resolveBackgroundMusic,
  resolveSkillMusicTrack
} from "./musicLibrary.js";
import { RUNTIME_AUDIO_ASSETS, RUNTIME_IMAGE_ASSETS } from "./assetRegistry.js";
import { STONE_DECORATIONS } from "./stoneDecorations.js";
import { CHARACTERS } from "./characters.js";
import { canonicalCharacterId } from "./characterAliases.js";
import { RECRUITMENT_ITEMS } from "./recruitment.js";
import { gameModeSkillEnabled } from "./gameModes.js";
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
  user = null,
  ownedCharacters = user?.ownedCharacters,
  ownedDecorations = user?.ownedDecorations,
  ownedMusicIds = user?.ownedMusicIds,
  shopItems = [],
  inventoryItems = [],
  achievementEquipmentAssets = user?.achievementEquipmentAssets,
  tracks = MUSIC_TRACKS,
  skillVoices = CHARACTER_SKILL_VOICES,
  systemVoices = CHARACTER_SYSTEM_VOICES
} = {}) {
  const accessibleCharacterIds = accessibleIds(ownedCharacters);
  const hasUserScope = user || ownedCharacters || ownedDecorations || ownedMusicIds;
  const visibleCharacters = Object.values(characters).filter((character) => {
    const characterId = canonicalCharacterId(character?.id ?? character?.slug);
    return !hasUserScope || accessibleCharacterIds.has(characterId);
  });
  const accessibleDecorationIds = accessibleIds(ownedDecorations);
  const visibleDecorations = Object.values(STONE_DECORATIONS).filter((decoration) => (
    !hasUserScope || accessibleDecorationIds.has(decoration?.id)
  ));
  const explicitlyOwnedTrackIds = new Set(parseMusicIds(ownedMusicIds));
  const accessibleTrackIds = new Set(ownedMusicIdsWithDefaults(ownedMusicIds, tracks));
  const visibleCharacterIds = compactUnique(visibleCharacters.map((character) => (
    canonicalCharacterId(character?.id ?? character?.slug)
  )));
  const visibleCharacterIdSet = new Set(visibleCharacterIds);
  const selectedCharacterId = canonicalCharacterId(user?.selectedCharacter) || visibleCharacterIds[0] || "";
  const criticalCharacters = visibleCharacters.filter((character) => (
    canonicalCharacterId(character?.id ?? character?.slug) === selectedCharacterId
  ));
  const deferredCharacters = visibleCharacters.filter((character) => (
    canonicalCharacterId(character?.id ?? character?.slug) !== selectedCharacterId
  ));
  const visibleTracks = Object.values(tracks ?? {}).filter((track) => {
    if (!track?.id || !accessibleTrackIds.has(track.id)) return false;
    if (track.type !== MUSIC_TYPES.skill) return true;
    if (explicitlyOwnedTrackIds.has(track.id)) return true;
    return visibleCharacterIdSet.has(canonicalCharacterId(track.characterId));
  });
  const homeTracks = visibleTracks.filter((track) => track?.type === MUSIC_TYPES.home);
  const deferredTracks = visibleTracks.filter((track) => track?.type !== MUSIC_TYPES.home);
  const equipmentAssets = Object.values(achievementEquipmentAssets ?? {});

  const criticalImages = compactUnique([
    ...criticalCharacters.map((character) => character?.portrait),
    ...RUNTIME_IMAGE_ASSETS.home
  ]);
  const deferredImages = compactUnique([
    ...deferredCharacters.map((character) => character?.portrait),
    ...RUNTIME_IMAGE_ASSETS.shop,
    ...Object.values(RECRUITMENT_ITEMS).map((item) => item?.imageUrl),
    ...recruitmentSurfaceImages(),
    ...shopItems.map((item) => item?.imageUrl),
    ...inventoryItems.map((item) => item?.imageUrl),
    ...equipmentAssets.map((asset) => asset?.imageUrl),
    ...visibleDecorations.flatMap((decoration) => [
      decoration.previewImageUrl,
      decoration.images?.black,
      decoration.images?.white
    ])
  ]);
  const images = compactUnique([...criticalImages, ...deferredImages]);

  const criticalAudio = compactUnique([
    ...RUNTIME_AUDIO_ASSETS.interaction,
    ...homeTracks.flatMap((track) => playbackAssetSources(track?.playback))
  ]);
  const deferredAudio = compactUnique([
    MATCH_SUCCESS_SOUND,
    VICTORY_SOUND,
    DEFEAT_SOUND,
    ...deferredTracks.flatMap((track) => playbackAssetSources(track?.playback)),
    ...visibleCharacterIds.flatMap((characterId) => voiceSourceCandidates(skillVoices?.[characterId])),
    ...visibleCharacterIds.flatMap((characterId) => Object.values(systemVoices?.[characterId] ?? {}).flatMap(voiceSourceCandidates))
  ]);
  const audio = compactUnique([...criticalAudio, ...deferredAudio]);

  return { criticalImages, deferredImages, images, criticalAudio, deferredAudio, audio };
}

export function battlePreloadAssets({
  room = null,
  characters = CHARACTERS,
  tracks = MUSIC_TRACKS,
  user = null,
  skillVoices = CHARACTER_SKILL_VOICES,
  systemVoices = CHARACTER_SYSTEM_VOICES
} = {}) {
  const players = room?.players ?? [];
  const skillEnabled = gameModeSkillEnabled(room?.mode ?? room?.game?.mode);
  const characterIds = compactUnique(players.map((player) => canonicalCharacterId(
    player.character?.id ?? player.characterId
  )));
  const roomCharacters = characterIds
    .map((characterId) => characters?.[characterId] ?? CHARACTERS[characterId])
    .filter(Boolean);
  const skillTracks = characterIds
    .map((characterId) => resolveSkillMusicTrack({
      characterId,
      selections: user?.musicSelections,
      ownedMusicIds: user?.ownedMusicIds,
      tracks
    }))
    .filter(Boolean);
  const derivedSkillTracks = characterIds
    .flatMap((characterId) => selectedDerivedSkillTracks({
      characterId,
      selections: user?.musicSelections,
      ownedMusicIds: user?.ownedMusicIds,
      tracks
    }));
  const battleTrack = resolveBackgroundMusic({
    view: "room",
    gamePhase: room?.game?.phase ?? room?.phase ?? "preloading",
    selections: user?.musicSelections,
    ownedMusicIds: user?.ownedMusicIds,
    tracks
  });

  const criticalImages = compactUnique([
    ...roomCharacters.map((character) => character?.portrait),
    ...(skillEnabled ? RUNTIME_IMAGE_ASSETS.effects : [])
  ]);
  const criticalAudio = compactUnique([
    MATCH_SUCCESS_SOUND,
    ...RUNTIME_AUDIO_ASSETS.interaction,
    ...playbackAssetSources(battleTrack?.playback),
    ...(skillEnabled ? skillTracks.flatMap((track) => playbackAssetSources(track.playback)) : []),
    ...(skillEnabled ? derivedSkillTracks.flatMap((track) => playbackAssetSources(track.playback)) : []),
    ...(skillEnabled ? characterIds.flatMap((characterId) => voiceSourceCandidates(skillVoices?.[characterId])) : []),
    ...characterIds.flatMap((characterId) => Object.entries(systemVoices?.[characterId] ?? {})
      .filter(([event]) => skillEnabled || !String(event).includes("skill-cast"))
      .flatMap(([, value]) => voiceSourceCandidates(value)))
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

function selectedDerivedSkillTracks({ characterId, selections, ownedMusicIds, tracks }) {
  const candidates = Object.values(tracks ?? {}).filter((track) => (
    track?.type === MUSIC_TYPES.skill
    && track.effectType
    && canonicalCharacterId(track.characterId) === characterId
  ));
  const effectTypes = compactUnique(candidates.map((track) => String(track.effectType ?? "").trim()));
  return effectTypes.map((effectType) => resolveSkillMusicTrack({
    characterId,
    effectType,
    fallbackTrackId: candidates.find((track) => String(track.effectType ?? "").trim() === effectType)?.id,
    selections,
    ownedMusicIds,
    tracks
  })).filter(Boolean);
}

export async function preloadLoginAssets(assets, {
  concurrency = 4,
  loadAudio = preloadFetch,
  loadEffectAudio = preloadEffectSound,
  loadImage = preloadImage,
  onProgress = () => {},
  onSkipped = () => {},
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
      onSkipped,
      taskTimeoutMs,
      onComplete: () => {
        completed += 1;
        onProgress(completed / criticalTasks.length);
      }
    });
  }
  void runPreloadTasks(deferredTasks, { concurrency, onSkipped, taskTimeoutMs });
}

export function retrySkippedPreloadAssets(skippedAssets, {
  concurrency = 2,
  loadAudio = preloadFetch,
  loadEffectAudio = preloadEffectSound,
  loadImage = preloadImage,
  retryDelaysMs = [0, 5000, 15000, 60000],
  taskTimeoutMs = 12000
} = {}) {
  const assets = compactUnique(skippedAssets);
  if (!assets.length) return () => {};
  let cancelled = false;
  const timers = [];

  retryDelaysMs.forEach((delayMs) => {
    const timer = setTimeout(() => {
      if (cancelled) return;
      void preloadLoginAssets(splitAssetsByType(assets), {
        concurrency,
        loadAudio,
        loadEffectAudio,
        loadImage,
        taskTimeoutMs
      });
    }, Math.max(0, Number(delayMs) || 0));
    timers.push(timer);
  });

  return () => {
    cancelled = true;
    timers.forEach((timer) => clearTimeout(timer));
  };
}

export async function preloadImageAssets(images = [], {
  concurrency = 3,
  loadImage = preloadImage,
  onSkipped = () => {},
  taskTimeoutMs = 3000
} = {}) {
  const tasks = compactUnique(images).map((src) => taskWithSource(src, () => loadImage(src)));
  await runPreloadTasks(tasks, { concurrency, onSkipped, taskTimeoutMs });
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

function accessibleIds(value) {
  if (Array.isArray(value)) {
    return new Set(value.map((entry) => canonicalCharacterId(entry?.id ?? entry?.slug ?? entry)).filter(Boolean));
  }
  const text = String(value ?? "").trim();
  if (!text) return new Set();
  if (text.startsWith("[")) {
    try {
      return accessibleIds(JSON.parse(text));
    } catch {
      return new Set();
    }
  }
  return new Set(text.split(",").map((entry) => canonicalCharacterId(entry)).filter(Boolean));
}

function recruitmentSurfaceImages() {
  return [
    "/assets/recruitment/notice-board-flat-candidate.webp",
    "/assets/recruitment/recruitment-letter-paper-flat.webp",
    "/assets/recruitment/recruitment-envelope-flat.webp",
    "/assets/recruitment/celebration-flat-candidate.webp"
  ];
}

function splitAssetsByType(assets) {
  return assets.reduce((groups, src) => {
    if (isAudioAsset(src)) groups.criticalAudio.push(src);
    else groups.criticalImages.push(src);
    return groups;
  }, { criticalImages: [], criticalAudio: [] });
}

function isAudioAsset(src) {
  return /\.(ogg|mp3|wav|m4a|aac|flac)(\?|#|$)/i.test(String(src ?? ""));
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
    ...images.map((src) => taskWithSource(src, () => loadImage(src))),
    ...audio.map((src) => taskWithSource(src, () => decodedEffects.has(src) ? loadEffectAudio(src) : loadAudio(src)))
  ];
}

function taskWithSource(src, run) {
  run.src = src;
  return run;
}

async function runPreloadTasks(tasks, {
  concurrency = 4,
  onComplete = () => {},
  onSkipped = () => {},
  taskTimeoutMs = 8000
} = {}) {
  if (tasks.length === 0) return;
  const workerCount = Math.max(1, Math.min(Number(concurrency) || 1, tasks.length));
  let nextIndex = 0;
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (nextIndex < tasks.length) {
      const task = tasks[nextIndex];
      nextIndex += 1;
      const taskPromise = Promise.resolve().then(task).catch(() => null);
      const result = await withTaskTimeout(taskPromise, taskTimeoutMs);
      if (result === null) onSkipped(task.src);
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
