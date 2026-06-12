import { BOARD_SOUND_TYPES } from "../shared/boardAudio.js";
import { DEFAULT_AUDIO_SETTINGS, audioVolume } from "./audioSettings.js";
import { browserAudioContextClass } from "./audioRuntime.js";

export const STONE_SOUND = "/assets/music/godown_clear.ogg";
export const CAPTURE_SOUND = "/assets/music/go_capture_clear.ogg";
export const HIDDEN_HAND_REVEAL_SOUND = "/assets/music/hidden_hand_reveal.ogg";
export const UI_CLOSE_WINDOW_SOUND = "/assets/music/ui_close_window.ogg";
export const UI_CONFIRM_SOUND = "/assets/music/ui_confirm.ogg";
export const UI_DETAIL_OPEN_SOUND = "/assets/music/ui_detail_open.ogg";
export const UI_HOUSE_OPEN_SOUND = "/assets/music/ui_house_open.ogg";
export const UI_MATCH_OPEN_SOUND = "/assets/music/ui_match_open.ogg";
export const UI_SHOP_OPEN_SOUND = "/assets/music/ui_shop_open.ogg";
export const UI_UNAVAILABLE_SOUND = "/assets/music/ui_unavailable.ogg";
export const UI_UNAVAILABLE_SHAKE_MS = 1063;

const effectBufferCache = new Map();
const effectPromiseCache = new Map();
let sharedEffectContext = null;

export function playEffectSound(src, audioSettings = DEFAULT_AUDIO_SETTINGS) {
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

export function playUiMatchOpenSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(UI_MATCH_OPEN_SOUND, audioSettings);
}

export function playUiShopOpenSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(UI_SHOP_OPEN_SOUND, audioSettings);
}

export function playUiUnavailableSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  playEffectSound(UI_UNAVAILABLE_SOUND, audioSettings);
}
