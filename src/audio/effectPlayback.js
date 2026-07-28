import { BOARD_SOUND_TYPES } from "../shared/boardAudio.js";
import {
  CAPTURE_SOUND,
  HIDDEN_HAND_REVEAL_SOUND,
  RECRUITMENT_MISS_SOUND,
  RECRUITMENT_SUCCESS_SOUND,
  STONE_SOUND,
  UI_CLOSE_WINDOW_SOUND,
  UI_CONFIRM_SOUND,
  UI_DETAIL_OPEN_SOUND,
  UI_FRIENDS_OPEN_SOUND,
  UI_HOUSE_OPEN_SOUND,
  UI_IRIS_DATABASE_OPEN_SOUND,
  UI_LEADERBOARD_OPEN_SOUND,
  UI_MATCH_OPEN_SOUND,
  UI_RECRUITMENT_OPEN_SOUND,
  UI_RESUME_OPEN_SOUND,
  UI_SHOP_OPEN_SOUND,
  UI_WAREHOUSE_OPEN_SOUND,
  UI_WATCH_OPEN_SOUND,
  UI_UNAVAILABLE_SOUND
} from "../shared/audioAssets.js";
import { DEFAULT_AUDIO_SETTINGS, audioVolume } from "./audioSettings.js";
import { browserAudioContextClass } from "./audioRuntime.js";

export {
  CAPTURE_SOUND,
  HIDDEN_HAND_REVEAL_SOUND,
  RECRUITMENT_MISS_SOUND,
  RECRUITMENT_SUCCESS_SOUND,
  STONE_SOUND,
  UI_CLOSE_WINDOW_SOUND,
  UI_CONFIRM_SOUND,
  UI_DETAIL_OPEN_SOUND,
  UI_FRIENDS_OPEN_SOUND,
  UI_HOUSE_OPEN_SOUND,
  UI_IRIS_DATABASE_OPEN_SOUND,
  UI_LEADERBOARD_OPEN_SOUND,
  UI_MATCH_OPEN_SOUND,
  UI_RECRUITMENT_OPEN_SOUND,
  UI_RESUME_OPEN_SOUND,
  UI_SHOP_OPEN_SOUND,
  UI_WAREHOUSE_OPEN_SOUND,
  UI_WATCH_OPEN_SOUND,
  UI_UNAVAILABLE_SOUND
};
export const UI_UNAVAILABLE_SHAKE_MS = 1063;

const effectBufferCache = new Map();
const effectPromiseCache = new Map();
let sharedEffectContext = null;

export function playEffectSound(src, audioSettings = DEFAULT_AUDIO_SETTINGS) {
  if (!String(src ?? "").trim()) return;
  const volume = audioVolume(audioSettings, "sfx");
  if (volume <= 0) return;
  if (!effectBufferCache.has(src)) {
    preloadEffectSound(src);
    playEffectSoundFallback(src, volume);
    return;
  }
  playEffectBuffer(src, volume).catch(() => {
    playEffectSoundFallback(src, volume);
  });
}

export function preloadEffectSound(src) {
  if (!src) return Promise.resolve(null);
  if (effectBufferCache.has(src)) return Promise.resolve(effectBufferCache.get(src));
  if (effectPromiseCache.has(src)) return effectPromiseCache.get(src);
  const context = getEffectAudioContext();
  if (!context) return Promise.resolve(null);
  const promise = fetch(src, { cache: "force-cache" })
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => context.decodeAudioData(arrayBuffer))
    .then((buffer) => {
      effectBufferCache.set(src, buffer);
      return buffer;
    })
    .catch(() => null)
    .finally(() => {
      effectPromiseCache.delete(src);
    });
  effectPromiseCache.set(src, promise);
  return promise;
}

async function playEffectBuffer(src, volume) {
  const context = getEffectAudioContext();
  const buffer = effectBufferCache.get(src);
  if (!context || !buffer) throw new Error("Effect audio buffer is not ready");
  if (context.state === "suspended") await context.resume();
  const source = context.createBufferSource();
  const gain = context.createGain();
  source.buffer = buffer;
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(context.destination);
  source.start();
  source.onended = () => {
    try {
      source.disconnect();
      gain.disconnect();
    } catch {
      // Audio nodes may already be disconnected by the browser.
    }
  };
}

function getEffectAudioContext() {
  if (sharedEffectContext && sharedEffectContext.state !== "closed") return sharedEffectContext;
  const AudioContextClass = browserAudioContextClass();
  if (!AudioContextClass) return null;
  try {
    sharedEffectContext = new AudioContextClass();
  } catch {
    sharedEffectContext = null;
    return null;
  }
  return sharedEffectContext;
}

function playEffectSoundFallback(src, volume) {
  if (typeof Audio === "undefined") return;
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.volume = volume;
  audio.play().catch(() => {});
}

export function playStoneSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(STONE_SOUND, audioSettings);
}

export function playCaptureSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(CAPTURE_SOUND, audioSettings);
}

export function playBoardSound(boardSoundAction, audioSettings = DEFAULT_AUDIO_SETTINGS) {
  if (!boardSoundAction) return;
  if (boardSoundAction.sound === BOARD_SOUND_TYPES.hiddenReveal) {
    playEffectSound(HIDDEN_HAND_REVEAL_SOUND, audioSettings);
    return;
  }
  if (boardSoundAction.sound === BOARD_SOUND_TYPES.capture) {
    playCaptureSound(audioSettings);
    return;
  }
  playStoneSound(audioSettings);
}

export function playUiConfirmSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(UI_CONFIRM_SOUND, audioSettings);
}

export function playUiCloseWindowSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(UI_CLOSE_WINDOW_SOUND, audioSettings);
}

export function playUiDetailOpenSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(UI_DETAIL_OPEN_SOUND, audioSettings);
}

export function playUiHouseOpenSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(UI_HOUSE_OPEN_SOUND, audioSettings);
}

export function playUiIrisDatabaseOpenSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(UI_IRIS_DATABASE_OPEN_SOUND, audioSettings);
}

export function playUiMatchOpenSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(UI_MATCH_OPEN_SOUND, audioSettings);
}

export function playUiResumeOpenSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(UI_RESUME_OPEN_SOUND, audioSettings);
}

export function playUiWarehouseOpenSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(UI_WAREHOUSE_OPEN_SOUND, audioSettings);
}

export function playUiWatchOpenSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(UI_WATCH_OPEN_SOUND, audioSettings);
}

export function playUiFriendsOpenSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(UI_FRIENDS_OPEN_SOUND, audioSettings);
}

export function playUiLeaderboardOpenSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(UI_LEADERBOARD_OPEN_SOUND, audioSettings);
}

export function playUiRecruitmentOpenSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(UI_RECRUITMENT_OPEN_SOUND, audioSettings);
}

export function playUiShopOpenSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(UI_SHOP_OPEN_SOUND, audioSettings);
}

export function playUiUnavailableSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(UI_UNAVAILABLE_SOUND, audioSettings);
}

export function playRecruitmentResultSound(resultType, audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(resultType === "success" ? RECRUITMENT_SUCCESS_SOUND : RECRUITMENT_MISS_SOUND, audioSettings);
}
