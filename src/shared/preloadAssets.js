import {
  CAPTURE_SOUND,
  HIDDEN_HAND_REVEAL_SOUND,
  preloadEffectSound,
  STONE_SOUND
} from "../audio/playback.jsx";
import {
  CHARACTER_SKILL_VOICES,
  DEFAULT_MUSIC_SELECTIONS,
  MATCH_SUCCESS_SOUND,
  MUSIC_TRACKS,
  VICTORY_SOUND,
  DEFEAT_SOUND
} from "./musicLibrary.js";
import { DENIA_CANDY_PORTRAIT } from "./candyPortraits.js";
import { STONE_DECORATIONS } from "./stoneDecorations.js";

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
  ownedCharacters = [],
  itemEffects = {},
  tracks = MUSIC_TRACKS,
  skillVoices = CHARACTER_SKILL_VOICES,
  musicSelections = DEFAULT_MUSIC_SELECTIONS
} = {}) {
  const images = compactUnique([
    ...Object.values(characters).map((character) => character?.portrait),
    itemEffects?.deniaRainbowGlow ? DENIA_CANDY_PORTRAIT : null,
    ...Object.values(STONE_DECORATIONS).flatMap((decoration) => [
      decoration.previewImageUrl,
      decoration.images?.black,
      decoration.images?.white
    ])
  ]);

  const defaultTracks = compactUnique([
    musicSelections.home,
    musicSelections.battle,
    DEFAULT_MUSIC_SELECTIONS.home,
    DEFAULT_MUSIC_SELECTIONS.battle
  ]);
  const audio = compactUnique([
    STONE_SOUND,
    CAPTURE_SOUND,
    HIDDEN_HAND_REVEAL_SOUND,
    MATCH_SUCCESS_SOUND,
    VICTORY_SOUND,
    DEFEAT_SOUND,
    ...defaultTracks.flatMap((trackId) => playbackAssetSources(tracks[trackId]?.playback)),
    ...ownedCharacters.map((characterId) => skillVoices[characterId])
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
