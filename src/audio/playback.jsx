import { VOICE_EFFECT_SETTINGS, audioBufferStats, boostedVoiceVolume, createAiryReverbImpulse, voiceNormalizationGain } from "../shared/voiceEffects.js";
import { DEFAULT_AUDIO_SETTINGS, audioVolume } from "./audioSettings.js";
import { browserAudioContextClass } from "./audioRuntime.js";
import { beginVoicePlayback, endVoicePlaybackSoon } from "./backgroundDucking.js";

export { DEFAULT_AUDIO_SETTINGS, audioVolume, loadAudioSettings } from "./audioSettings.js";
export {
  BackgroundMusic,
  installBackgroundResumeTriggers,
  loadBackgroundBuffer,
  pauseBackgroundPlayback,
  primeBackgroundAudioRuntime,
  recoverBackgroundPlayback,
  resumeBackgroundContextWithFallback,
  stopBackgroundPlayback
} from "./backgroundMusic.jsx";
export {
  CAPTURE_SOUND,
  HIDDEN_HAND_REVEAL_SOUND,
  playRecruitmentResultSound,
  playBoardSound,
  playCaptureSound,
  playEffectSound,
  playUiCloseWindowSound,
  playUiConfirmSound,
  playUiDetailOpenSound,
  playUiFriendsOpenSound,
  playUiHouseOpenSound,
  playUiLeaderboardOpenSound,
  playUiMatchOpenSound,
  playUiRecruitmentOpenSound,
  playUiResumeOpenSound,
  playUiShopOpenSound,
  playUiUnavailableSound,
  playUiWarehouseOpenSound,
  playUiWatchOpenSound,
  playStoneSound,
  preloadEffectSound,
  RECRUITMENT_MISS_SOUND,
  RECRUITMENT_SUCCESS_SOUND,
  STONE_SOUND,
  UI_CLOSE_WINDOW_SOUND,
  UI_CONFIRM_SOUND,
  UI_DETAIL_OPEN_SOUND,
  UI_FRIENDS_OPEN_SOUND,
  UI_HOUSE_OPEN_SOUND,
  UI_LEADERBOARD_OPEN_SOUND,
  UI_MATCH_OPEN_SOUND,
  UI_RECRUITMENT_OPEN_SOUND,
  UI_RESUME_OPEN_SOUND,
  UI_SHOP_OPEN_SOUND,
  UI_WAREHOUSE_OPEN_SOUND,
  UI_WATCH_OPEN_SOUND,
  UI_UNAVAILABLE_SHAKE_MS,
  UI_UNAVAILABLE_SOUND
} from "./effectPlayback.js";
export { playCountdownBeep, playDoorbellSound } from "./proceduralSounds.js";

const voiceBufferCache = new Map();
const voicePromiseCache = new Map();
let sharedVoiceContext = null;
let activeVoicePlayback = null;

export function playVoiceSound(src, audioSettings = DEFAULT_AUDIO_SETTINGS) {
  const volume = audioVolume(audioSettings, "voice");
  if (volume <= 0) return;
  playVoiceSoundWithEffects(src, boostedVoiceVolume(volume)).catch(() => {
    playVoiceSoundFallback(src, boostedVoiceVolume(volume));
  });
}

export function stopVoicePlayback() {
  stopActiveVoicePlayback();
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function preloadVoiceSound(src) {
  if (!src) return Promise.resolve(null);
  if (voiceBufferCache.has(src)) return Promise.resolve(voiceBufferCache.get(src));
  if (voicePromiseCache.has(src)) return voicePromiseCache.get(src);
  const context = getVoiceAudioContext();
  if (!context) return Promise.resolve(null);
  const promise = fetch(src)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => context.decodeAudioData(arrayBuffer))
    .then((buffer) => {
      voiceBufferCache.set(src, buffer);
      return buffer;
    })
    .catch(() => null)
    .finally(() => {
      voicePromiseCache.delete(src);
    });
  voicePromiseCache.set(src, promise);
  return promise;
}

export function playPreloadedVoiceSound(src, audioSettings = DEFAULT_AUDIO_SETTINGS) {
  if (!voiceBufferCache.has(src)) {
    playVoiceSound(src, audioSettings);
    return;
  }
  const volume = audioVolume(audioSettings, "voice");
  if (volume <= 0) return;
  const buffer = voiceBufferCache.get(src);
  playVoiceBuffer(buffer, boostedVoiceVolume(volume)).catch(() => {
    playVoiceSound(src, audioSettings);
  });
}

function getVoiceAudioContext() {
  if (sharedVoiceContext && sharedVoiceContext.state !== "closed") return sharedVoiceContext;
  const AudioContextClass = browserAudioContextClass();
  if (!AudioContextClass) return null;
  try {
    sharedVoiceContext = new AudioContextClass();
  } catch {
    sharedVoiceContext = null;
    return null;
  }
  return sharedVoiceContext;
}

async function playVoiceSoundWithEffects(src, volume) {
  const context = getVoiceAudioContext();
  if (!context) throw new Error("Web Audio is not available");
  if (context.state === "suspended") await context.resume();
  const response = await fetch(src);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = await context.decodeAudioData(arrayBuffer);
  await playVoiceBuffer(buffer, volume);
}

async function playVoiceBuffer(buffer, volume) {
  const context = getVoiceAudioContext();
  if (!context) throw new Error("Web Audio is not available");
  if (context.state === "suspended") await context.resume();

  const source = context.createBufferSource();
  source.buffer = buffer;

  const cleanupNodes = connectVoiceSource(context, source, normalizedVoiceVolume(buffer, volume));
  let released = false;
  const voiceHandle = {
    stop: () => {
      try {
        source.stop();
      } catch {
        // The source may already be stopped by the browser.
      }
    }
  };
  const release = () => {
    if (released) return;
    released = true;
    if (activeVoicePlayback === voiceHandle) activeVoicePlayback = null;
    endVoicePlaybackSoon();
    setTimeout(cleanupNodes, VOICE_EFFECT_SETTINGS.reverbSeconds * 1000 + 250);
  };
  stopActiveVoicePlayback();
  activeVoicePlayback = voiceHandle;
  beginVoicePlayback();
  source.start();
  source.onended = release;
}

function normalizedVoiceVolume(buffer, volume) {
  return volume * voiceNormalizationGain(audioBufferStats(buffer));
}

function connectVoiceSource(context, source, volume) {
  const voiceGain = context.createGain();
  voiceGain.gain.value = volume;

  const dryGain = context.createGain();
  dryGain.gain.value = VOICE_EFFECT_SETTINGS.dry;

  const wetGain = context.createGain();
  wetGain.gain.value = VOICE_EFFECT_SETTINGS.wet;

  const preDelay = context.createDelay(0.2);
  preDelay.delayTime.value = VOICE_EFFECT_SETTINGS.preDelaySeconds;

  const convolver = context.createConvolver();
  convolver.buffer = createAiryReverbImpulse(context);

  source.connect(dryGain);
  dryGain.connect(voiceGain);
  source.connect(preDelay);
  preDelay.connect(convolver);
  convolver.connect(wetGain);
  wetGain.connect(voiceGain);
  voiceGain.connect(context.destination);
  return () => {
    for (const node of [source, dryGain, preDelay, convolver, wetGain, voiceGain]) {
      try {
        node.disconnect();
      } catch {
        // Nodes can already be disconnected after browser cleanup.
      }
    }
  };
}

function playVoiceSoundFallback(src, volume) {
  stopActiveVoicePlayback();
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.volume = volume;
  const voiceHandle = {
    stop: () => audio.pause()
  };
  activeVoicePlayback = voiceHandle;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    if (activeVoicePlayback === voiceHandle) activeVoicePlayback = null;
    endVoicePlaybackSoon();
  };
  audio.addEventListener("play", beginVoicePlayback, { once: true });
  audio.addEventListener("ended", release, { once: true });
  audio.addEventListener("pause", release, { once: true });
  audio.addEventListener("error", release, { once: true });
  audio.play().catch(() => {});
}

function stopActiveVoicePlayback() {
  const active = activeVoicePlayback;
  if (!active) return;
  activeVoicePlayback = null;
  try {
    active.stop();
  } catch {
    // Some browser playback objects can only be stopped once.
  }
}

export function speakText(text, audioSettings = DEFAULT_AUDIO_SETTINGS) {
  const volume = audioVolume(audioSettings, "voice");
  if (volume <= 0) return;
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;
  stopActiveVoicePlayback();
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 1.05;
  utterance.volume = volume;
  utterance.onstart = beginVoicePlayback;
  utterance.onend = endVoicePlaybackSoon;
  utterance.onerror = endVoicePlaybackSoon;
  window.speechSynthesis.speak(utterance);
}
