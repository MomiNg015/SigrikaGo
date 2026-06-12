import {
  CAPTURE_SOUND,
  HIDDEN_HAND_REVEAL_SOUND,
  preloadEffectSound,
  STONE_SOUND,
  UI_CLOSE_WINDOW_SOUND,
  UI_CONFIRM_SOUND,
  UI_DETAIL_OPEN_SOUND,
  UI_HOUSE_OPEN_SOUND,
  UI_MATCH_OPEN_SOUND,
  UI_SHOP_OPEN_SOUND,
  UI_UNAVAILABLE_SOUND
} from "../audio/playback.jsx";
import {
  CHARACTER_SYSTEM_VOICES,
  CHARACTER_SKILL_VOICES,
  MATCH_SUCCESS_SOUND,
  MUSIC_TRACKS,
  VICTORY_SOUND,
  DEFEAT_SOUND
} from "./musicLibrary.js";
import { DENIA_CANDY_PORTRAIT } from "./candyPortraits.js";
import { STONE_DECORATIONS } from "./stoneDecorations.js";

const HOME_IMAGE_ASSETS = [
  "/assets/home/book-entry.webp",
  "/assets/home/fantasy-match-entry.webp",
  "/assets/home/multipurpose-classroom-bg.webp"
];

const SHOP_IMAGE_ASSETS = [
  "/assets/zahiya_shop.webp",
  "/assets/items/rainbow-bean-candy.webp"
];

const EFFECT_IMAGE_ASSETS = [
  DENIA_CANDY_PORTRAIT,
  "/assets/effects/denia-bubble-pop.webp"
];

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
    ...HOME_IMAGE_ASSETS
  ]);
  const deferredImages = compactUnique([
    ...SHOP_IMAGE_ASSETS,
    ...EFFECT_IMAGE_ASSETS,
    ...Object.values(STONE_DECORATIONS).flatMap((decoration) => [
      decoration.previewImageUrl,
      decoration.images?.black,
      decoration.images?.white
    ])
  ]);
  const images = compactUnique([...criticalImages, ...deferredImages]);

  const criticalAudio = compactUnique([
    STONE_SOUND,
    CAPTURE_SOUND,
    HIDDEN_HAND_REVEAL_SOUND,
    UI_CLOSE_WINDOW_SOUND,
    UI_CONFIRM_SOUND,
    UI_DETAIL_OPEN_SOUND,
    UI_HOUSE_OPEN_SOUND,
    UI_MATCH_OPEN_SOUND,
    UI_SHOP_OPEN_SOUND,
    UI_UNAVAILABLE_SOUND
  ]);
  const deferredAudio = compactUnique([
    MATCH_SUCCESS_SOUND,
    VICTORY_SOUND,
    DEFEAT_SOUND,
    ...Object.values(tracks).flatMap((track) => playbackAssetSources(track?.playback)),
    ...Object.values(skillVoices),
    ...Object.values(systemVoices).flatMap((voiceMap) => Object.values(voiceMap ?? {}))
  ]);
  const audio = compactUnique([...criticalAudio, ...deferredAudio]);

  return { criticalImages, deferredImages, images, criticalAudio, deferredAudio, audio };
}

export async function preloadLoginAssets(assets, {
  concurrency = 6,
  loadAudio = preloadFetch,
  loadEffectAudio = preloadEffectSound,
  loadImage = preloadImage,
  onProgress = () => {}
} = {}) {
  const groups = normalizePreloadAssetGroups(assets);
  const decodedEffects = new Set([
    STONE_SOUND,
    CAPTURE_SOUND,
    HIDDEN_HAND_REVEAL_SOUND,
    UI_CLOSE_WINDOW_SOUND,
    UI_CONFIRM_SOUND,
    UI_DETAIL_OPEN_SOUND,
    UI_HOUSE_OPEN_SOUND,
    UI_MATCH_OPEN_SOUND,
    UI_SHOP_OPEN_SOUND,
    UI_UNAVAILABLE_SOUND
  ]);
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
      onComplete: () => {
        completed += 1;
        onProgress(completed / criticalTasks.length);
      }
    });
  }
  void runPreloadTasks(deferredTasks, { concurrency });
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

async function runPreloadTasks(tasks, { concurrency = 6, onComplete = () => {} } = {}) {
  if (tasks.length === 0) return;
  const workerCount = Math.max(1, Math.min(Number(concurrency) || 1, tasks.length));
  let nextIndex = 0;
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (nextIndex < tasks.length) {
      const task = tasks[nextIndex];
      nextIndex += 1;
      await task().catch(() => null);
      onComplete();
    }
  }));
}
