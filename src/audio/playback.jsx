import { VOICE_EFFECT_SETTINGS, boostedVoiceVolume, createAiryReverbImpulse } from "../shared/voiceEffects.js";
import { DEFAULT_AUDIO_SETTINGS, audioVolume } from "./audioSettings.js";
import { browserAudioContextClass } from "./audioRuntime.js";
import { countdownVoiceOffset } from "./countdownVoiceTiming.js";

export { DEFAULT_AUDIO_SETTINGS, audioVolume, loadAudioSettings } from "./audioSettings.js";
export {
  assignBackgroundTrack,
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
  playRecruitmentMagicClockFastForwardSound,
  playRecruitmentResultSound,
  playBoardSound,
  playCaptureSound,
  playEffectSound,
  playUiCloseWindowSound,
  playUiConfirmSound,
  playUiDetailOpenSound,
  playUiFriendsOpenSound,
  playUiHouseOpenSound,
  playUiIrisDatabaseOpenSound,
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
  RECRUITMENT_MAGIC_CLOCK_FAST_FORWARD_SOUND,
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
  UI_UNAVAILABLE_SHAKE_MS,
  UI_UNAVAILABLE_SOUND
} from "./effectPlayback.js";
export { playCountdownBeep, playDoorbellSound } from "./proceduralSounds.js";

const voiceBufferCache = new Map();
const voicePromiseCache = new Map();
let sharedVoiceContext = null;
let activeVoicePlayback = null;
let voiceRequestId = 0;

export function playVoiceSound(src, audioSettings = DEFAULT_AUDIO_SETTINGS, playbackOptions = {}) {
  const requestId = ++voiceRequestId;
  const requestedAt = performance.now();
  const isCurrent = () => requestId === voiceRequestId
    && (playbackOptions.maxStartDelayMs == null || performance.now() - requestedAt <= playbackOptions.maxStartDelayMs);
  const volume = audioVolume(audioSettings, "voice");
  if (volume <= 0) return;
  playVoiceSoundWithEffects(src, boostedVoiceVolume(volume), playbackOptions, isCurrent).catch(() => {
    if (isCurrent()) playVoiceSoundFallback(src, boostedVoiceVolume(volume), isCurrent);
  });
  return () => {
    if (requestId !== voiceRequestId) return;
    stopVoicePlayback();
  };
}

export function stopVoicePlayback() {
  voiceRequestId += 1;
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
    .then((response) => {
      if (!response.ok) throw new Error("Voice audio could not be loaded");
      return response.arrayBuffer();
    })
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

export function playPreloadedVoiceSound(src, audioSettings = DEFAULT_AUDIO_SETTINGS, playbackOptions = {}) {
  return playVoiceSound(src, audioSettings, playbackOptions);
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

async function playVoiceSoundWithEffects(src, volume, playbackOptions, isCurrent) {
  const context = getVoiceAudioContext();
  if (!context) throw new Error("Web Audio is not available");
  const buffer = voiceBufferCache.get(src) || await preloadVoiceSound(src);
  if (!isCurrent()) return;
  if (!buffer) throw new Error("Voice audio could not be decoded");
  await playVoiceBuffer(buffer, volume, playbackOptions, isCurrent);
}

async function playVoiceBuffer(buffer, volume, playbackOptions, isCurrent) {
  const context = getVoiceAudioContext();
  if (!context) throw new Error("Web Audio is not available");
  if (context.state === "suspended") await context.resume();
  if (!isCurrent()) return;
  if (context.state !== "running") throw new Error("Voice audio context is suspended");

  const source = context.createBufferSource();
  source.buffer = buffer;

  const cleanupNodes = connectVoiceSource(context, source, volume, playbackOptions);
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
    const cleanupDelayMs = playbackOptions.reverb === false
      ? 0
      : VOICE_EFFECT_SETTINGS.reverbSeconds * 1000 + 250;
    setTimeout(cleanupNodes, cleanupDelayMs);
  };
  stopActiveVoicePlayback();
  activeVoicePlayback = voiceHandle;
  source.start(0, playbackOptions.trimLeadingSilence ? countdownVoiceOffset(buffer) : 0);
  source.onended = release;
}

function connectVoiceSource(context, source, volume, playbackOptions = {}) {
  const voiceGain = context.createGain();
  voiceGain.gain.value = volume;

  const dryGain = context.createGain();
  const reverb = playbackOptions.reverb !== false;
  dryGain.gain.value = reverb ? VOICE_EFFECT_SETTINGS.dry : 1;

  source.connect(dryGain);
  dryGain.connect(voiceGain);

  if (!reverb) {
    voiceGain.connect(context.destination);
    return disconnectAudioNodes([source, dryGain, voiceGain]);
  }

  const wetGain = context.createGain();
  wetGain.gain.value = VOICE_EFFECT_SETTINGS.wet;

  const preDelay = context.createDelay(0.2);
  preDelay.delayTime.value = VOICE_EFFECT_SETTINGS.preDelaySeconds;

  const convolver = context.createConvolver();
  convolver.buffer = createAiryReverbImpulse(context);

  source.connect(preDelay);
  preDelay.connect(convolver);
  convolver.connect(wetGain);
  wetGain.connect(voiceGain);
  voiceGain.connect(context.destination);
  return disconnectAudioNodes([source, dryGain, preDelay, convolver, wetGain, voiceGain]);
}

function disconnectAudioNodes(nodes) {
  return () => {
    for (const node of nodes) {
      try {
        node.disconnect();
      } catch {
        // Nodes can already be disconnected after browser cleanup.
      }
    }
  };
}

function playVoiceSoundFallback(src, volume, isCurrent) {
  if (typeof Audio === "undefined") return;
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
  };
  audio.addEventListener("ended", release, { once: true });
  audio.addEventListener("pause", release, { once: true });
  audio.addEventListener("error", release, { once: true });
  // Media loading can finish after the next tick or after the room unmounts.
  audio.addEventListener("playing", () => {
    if (!isCurrent()) audio.pause();
  }, { once: true });
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
  const requestId = ++voiceRequestId;
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
  window.speechSynthesis.speak(utterance);
  return () => {
    if (requestId === voiceRequestId) stopVoicePlayback();
  };
}
