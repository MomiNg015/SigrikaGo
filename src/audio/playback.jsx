import { useEffect, useRef } from "react";
import { BOARD_SOUND_TYPES } from "../shared/boardAudio.js";
import { BGM_FADE_SECONDS, BGM_START_DELAY_SECONDS, createDuckedVolume, createPlaybackKey, createPlaybackSchedule, createVolumeRamp } from "../shared/audioScheduling.js";
import { VOICE_EFFECT_SETTINGS, audioBufferStats, boostedVoiceVolume, createAiryReverbImpulse, voiceNormalizationGain } from "../shared/voiceEffects.js";

export const STONE_SOUND = "/assets/music/godown_clear.ogg";
export const CAPTURE_SOUND = "/assets/music/go_capture_clear.ogg";
export const HIDDEN_HAND_REVEAL_SOUND = "/assets/music/hidden_hand_reveal.ogg";

export const DEFAULT_AUDIO_SETTINGS = {
  master: 80,
  bgm: 50,
  sfx: 80,
  voice: 80
};

const voiceBufferCache = new Map();
const voicePromiseCache = new Map();
const effectBufferCache = new Map();
const effectPromiseCache = new Map();
const backgroundDuckSubscribers = new Set();
let sharedVoiceContext = null;
let sharedEffectContext = null;
let activeVoiceCount = 0;

export function BackgroundMusic({ track, audioSettings, resumeSignal = 0 }) {
  const playerRef = useRef({
    context: null,
    active: [],
    baseVolume: 0,
    retry: null,
    generation: 0,
    currentTrack: null,
    bufferCache: new Map()
  });
  const volume = audioVolume(audioSettings, "bgm");
  const trackKey = createPlaybackKey(track);

  useEffect(() => {
    setBackgroundBaseVolume(playerRef.current, volume);
  }, [volume]);

  useEffect(() => {
    const state = playerRef.current;
    const refresh = () => setBackgroundVolume(state);
    backgroundDuckSubscribers.add(refresh);
    return () => {
      backgroundDuckSubscribers.delete(refresh);
    };
  }, []);

  useEffect(() => installBackgroundResumeTriggers(playerRef.current), []);

  useEffect(() => {
    recoverBackgroundPlayback(playerRef.current);
  }, [resumeSignal]);

  useEffect(() => {
    const state = playerRef.current;
    state.generation += 1;
    const generation = state.generation;
    if (!track) {
      state.currentTrack = null;
      fadeOutBackgroundPlayers(state);
      return () => {};
    }

    const context = getBackgroundAudioContext(state);
    resumeBackgroundContextWithFallback(state);
    state.baseVolume = volume;
    state.currentTrack = track;
    scheduleBackgroundTrack({ state, context, track, generation }).catch(() => {});

    return () => {};
  }, [trackKey]);

  return null;
}

function recoverBackgroundPlayback(state) {
  resumeBackgroundContextWithFallback(state);
  if (!state.currentTrack) return;
  const context = getBackgroundAudioContext(state);
  if (!context) return;
  state.generation += 1;
  const generation = state.generation;
  scheduleBackgroundTrack({ state, context, track: state.currentTrack, generation }).catch(() => {});
}

function getBackgroundAudioContext(state) {
  if (state.context) return state.context;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  state.context = new AudioContextClass();
  return state.context;
}

async function scheduleBackgroundTrack({ state, context, track, generation }) {
  if (!context) return;
  const sources = playbackSources(track.playback);
  const decodedEntries = await Promise.all(
    sources.map(async (src) => [src, await loadBackgroundBuffer(state, context, src)])
  );
  if (generation !== state.generation) return;

  const buffers = Object.fromEntries(decodedEntries);
  const startAt = context.currentTime + BGM_START_DELAY_SECONDS;
  const schedule = createPlaybackSchedule({ playback: track.playback, buffers, startAt });
  const gain = context.createGain();
  applyGainRamp(gain.gain, createVolumeRamp({ from: 0, to: currentBackgroundVolume(state), startAt }));
  gain.connect(context.destination);
  fadeOutBackgroundPlayers(state);

  const sourcesToStop = [];
  for (const event of schedule) {
    const source = context.createBufferSource();
    source.buffer = buffers[event.src];
    source.loop = event.loop;
    source.connect(gain);
    source.start(event.startAt);
    sourcesToStop.push(source);
  }

  state.active.push({ gain, sources: sourcesToStop });
}

function playbackSources(playback) {
  if (playback.mode === "intro-loop") return [playback.introSrc, playback.loopSrc];
  return [playback.src];
}

async function loadBackgroundBuffer(state, context, src) {
  if (state.bufferCache.has(src)) return state.bufferCache.get(src);
  const response = await fetch(src);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = await context.decodeAudioData(arrayBuffer);
  state.bufferCache.set(src, buffer);
  return buffer;
}

export function resumeBackgroundContextWithFallback(state) {
  const context = state.context;
  if (!context || context.state !== "suspended") return;
  context.resume()
    .then(() => {
      if (context.state === "suspended") installBackgroundResumeRetry(state, context);
    })
    .catch(() => installBackgroundResumeRetry(state, context));
}

export function installBackgroundResumeTriggers(state) {
  if (typeof window === "undefined") return () => {};
  const doc = typeof document === "undefined" ? null : document;
  const retry = () => resumeBackgroundContextWithFallback(state);
  const retryWhenVisible = () => {
    if (doc?.visibilityState === "hidden") return;
    retry();
  };
  window.addEventListener("pageshow", retry);
  window.addEventListener("focus", retry);
  window.addEventListener("online", retry);
  window.addEventListener("pointerdown", retry);
  window.addEventListener("touchstart", retry);
  window.addEventListener("keydown", retry);
  doc?.addEventListener?.("visibilitychange", retryWhenVisible);
  return () => {
    window.removeEventListener("pageshow", retry);
    window.removeEventListener("focus", retry);
    window.removeEventListener("online", retry);
    window.removeEventListener("pointerdown", retry);
    window.removeEventListener("touchstart", retry);
    window.removeEventListener("keydown", retry);
    doc?.removeEventListener?.("visibilitychange", retryWhenVisible);
  };
}

function installBackgroundResumeRetry(state, context) {
  if (state.retry || typeof window === "undefined") return;
  state.retry = () => {
    window.removeEventListener("pointerdown", state.retry);
    window.removeEventListener("keydown", state.retry);
    window.removeEventListener("touchstart", state.retry);
    state.retry = null;
    context.resume().catch(() => {});
  };
  window.addEventListener("pointerdown", state.retry, { once: true });
  window.addEventListener("keydown", state.retry, { once: true });
  window.addEventListener("touchstart", state.retry, { once: true });
}

function setBackgroundBaseVolume(state, volume) {
  state.baseVolume = volume;
  setBackgroundVolume(state);
}

function setBackgroundVolume(state) {
  const context = state.context;
  if (!context) return;
  const now = context.currentTime;
  const volume = currentBackgroundVolume(state);
  for (const player of state.active) {
    player.gain.gain.cancelScheduledValues(now);
    player.gain.gain.setValueAtTime(player.gain.gain.value, now);
    player.gain.gain.linearRampToValueAtTime(volume, now + 0.12);
  }
}

function currentBackgroundVolume(state) {
  return createDuckedVolume({
    volume: state.baseVolume,
    activeVoiceCount
  });
}

function fadeOutBackgroundPlayers(state) {
  const context = state.context;
  if (!context) {
    state.active = [];
    return;
  }
  const now = context.currentTime;
  const previous = state.active;
  state.active = [];
  for (const player of previous) {
    player.gain.gain.cancelScheduledValues(now);
    player.gain.gain.setValueAtTime(player.gain.gain.value, now);
    player.gain.gain.linearRampToValueAtTime(0, now + BGM_FADE_SECONDS);
    for (const source of player.sources) {
      try {
        source.stop(now + BGM_FADE_SECONDS + 0.05);
      } catch {
        // The source may already have ended naturally.
      }
    }
  }
}

function applyGainRamp(param, ramp) {
  for (const event of ramp) {
    if (event.type === "set") param.setValueAtTime(event.value, event.time);
    if (event.type === "linear") param.linearRampToValueAtTime(event.value, event.time);
  }
}

export function loadAudioSettings() {
  try {
    return {
      ...DEFAULT_AUDIO_SETTINGS,
      ...JSON.parse(localStorage.getItem("sigrika-audio-settings") ?? "{}")
    };
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

export function audioVolume(settings, channel) {
  return Math.max(0, Math.min(1, ((settings?.master ?? DEFAULT_AUDIO_SETTINGS.master) / 100) * ((settings?.[channel] ?? 100) / 100)));
}

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
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
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
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.volume = volume;
  audio.play().catch(() => {});
}

export function playVoiceSound(src, audioSettings = DEFAULT_AUDIO_SETTINGS) {
  const volume = audioVolume(audioSettings, "voice");
  if (volume <= 0) return;
  playVoiceSoundWithEffects(src, boostedVoiceVolume(volume)).catch(() => {
    playVoiceSoundFallback(src, boostedVoiceVolume(volume));
  });
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
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
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
  beginVoicePlayback();
  source.start();
  source.onended = () => {
    endVoicePlaybackSoon();
    setTimeout(cleanupNodes, VOICE_EFFECT_SETTINGS.reverbSeconds * 1000 + 250);
  };
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
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.volume = volume;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    endVoicePlaybackSoon();
  };
  audio.addEventListener("play", beginVoicePlayback, { once: true });
  audio.addEventListener("ended", release, { once: true });
  audio.addEventListener("pause", release, { once: true });
  audio.addEventListener("error", release, { once: true });
  audio.play().catch(() => {});
}

function beginVoicePlayback() {
  activeVoiceCount += 1;
  notifyBackgroundDuckSubscribers();
}

function endVoicePlaybackSoon() {
  window.setTimeout(() => {
    activeVoiceCount = Math.max(0, activeVoiceCount - 1);
    notifyBackgroundDuckSubscribers();
  }, 180);
}

function notifyBackgroundDuckSubscribers() {
  for (const subscriber of backgroundDuckSubscribers) subscriber();
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

export function playCountdownBeep(second, audioSettings = DEFAULT_AUDIO_SETTINGS) {
  const volume = audioVolume(audioSettings, "sfx");
  if (volume <= 0) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = second <= 3 ? "square" : "sine";
  oscillator.frequency.setValueAtTime(second <= 3 ? 880 : 620, context.currentTime);
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime((second <= 3 ? 0.2 : 0.13) * volume, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.11);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.12);
}

export function playDoorbellSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  const volume = audioVolume(audioSettings, "sfx");
  if (volume <= 0) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  if (context.state === "suspended") context.resume().catch(() => {});
  const tones = [
    { at: 0, frequency: 784, length: 0.18 },
    { at: 0.16, frequency: 1046.5, length: 0.28 }
  ];
  for (const tone of tones) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + tone.at;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(tone.frequency, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.2 * volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + tone.length);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + tone.length + 0.04);
  }
}

export function speakText(text, audioSettings = DEFAULT_AUDIO_SETTINGS) {
  const volume = audioVolume(audioSettings, "voice");
  if (volume <= 0) return;
  if (!("speechSynthesis" in window)) return;
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
