import {
  CAPTURE_SOUND,
  HIDDEN_HAND_REVEAL_SOUND,
  preloadEffectSound,
  STONE_SOUND
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
  const images = compactUnique([
    ...Object.values(characters).map((character) => character?.portrait),
    ...HOME_IMAGE_ASSETS,
    ...SHOP_IMAGE_ASSETS,
    ...EFFECT_IMAGE_ASSETS,
    ...Object.values(STONE_DECORATIONS).flatMap((decoration) => [
      decoration.previewImageUrl,
      decoration.images?.black,
      decoration.images?.white
    ])
  ]);

  const audio = compactUnique([
    STONE_SOUND,
    CAPTURE_SOUND,
    HIDDEN_HAND_REVEAL_SOUND,
    MATCH_SUCCESS_SOUND,
    VICTORY_SOUND,
    DEFEAT_SOUND,
    ...Object.values(tracks).flatMap((track) => playbackAssetSources(track?.playback)),
    ...Object.values(skillVoices),
    ...Object.values(systemVoices).flatMap((voiceMap) => Object.values(voiceMap ?? {}))
  ]);

  return { images, audio };
}

export async function preloadLoginAssets(assets, { onProgress = () => {} } = {}) {
  const images = assets?.images ?? [];
  const audio = assets?.audio ?? [];
  const decodedEffects = new Set([STONE_SOUND, CAPTURE_SOUND, HIDDEN_HAND_REVEAL_SOUND]);
  const tasks = [
    ...images.map((src) => () => preloadImage(src)),
    ...audio.map((src) => () => decodedEffects.has(src) ? preloadEffectSound(src) : preloadFetch(src))
  ];
  if (tasks.length === 0) {
    onProgress(1);
    return;
  }
  let completed = 0;
  await Promise.all(tasks.map(async (task) => {
    await task().catch(() => null);
    completed += 1;
    onProgress(completed / tasks.length);
  }));
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
