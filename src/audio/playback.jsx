import { useEffect, useRef } from "react";
import { BOARD_SOUND_TYPES } from "../shared/boardAudio.js";
import { BGM_FADE_SECONDS, BGM_START_DELAY_SECONDS, createPlaybackKey, createPlaybackSchedule, createVolumeRamp } from "../shared/audioScheduling.js";
import { VOICE_EFFECT_SETTINGS, boostedVoiceVolume, createAiryReverbImpulse } from "../shared/voiceEffects.js";

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
let sharedVoiceContext = null;

export function BackgroundMusic({ track, audioSettings }) {
  const playerRef = useRef({
    context: null,
    active: [],
    retry: null,
    generation: 0,
    bufferCache: new Map()
  });
  const volume = audioVolume(audioSettings, "bgm");
  const trackKey = createPlaybackKey(track);

  useEffect(() => {
    setBackgroundVolume(playerRef.current, volume);
  }, [volume]);

  useEffect(() => {
    const state = playerRef.current;
    state.generation += 1;
    const generation = state.generation;
    if (!track) {
      fadeOutBackgroundPlayers(state);
      return () => {};
    }

    const context = getBackgroundAudioContext(state);
    resumeBackgroundContextWithFallback(state);
    scheduleBackgroundTrack({ state, context, track, volume, generation }).catch(() => {});

    return () => {};
  }, [trackKey]);

  return null;
}

function getBackgroundAudioContext(state) {
  if (state.context) return state.context;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  state.context = new AudioContextClass();
  return state.context;
}

async function scheduleBackgroundTrack({ state, context, track, volume, generation }) {
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
  applyGainRamp(gain.gain, createVolumeRamp({ from: 0, to: volume, startAt }));
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

function resumeBackgroundContextWithFallback(state) {
  const context = state.context;
  if (!context || context.state !== "suspended") return;
  context.resume().catch(() => {
    if (state.retry) return;
    state.retry = () => {
      window.removeEventListener("pointerdown", state.retry);
      window.removeEventListener("keydown", state.retry);
      state.retry = null;
      context.resume().catch(() => {});
    };
    window.addEventListener("pointerdown", state.retry, { once: true });
    window.addEventListener("keydown", state.retry, { once: true });
  });
}

function setBackgroundVolume(state, volume) {
  const context = state.context;
  if (!context) return;
  const now = context.currentTime;
  for (const player of state.active) {
    player.gain.gain.cancelScheduledValues(now);
    player.gain.gain.setValueAtTime(player.gain.gain.value, now);
    player.gain.gain.linearRampToValueAtTime(volume, now + 0.12);
  }
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

  const cleanupNodes = connectVoiceSource(context, source, volume);
  source.start();
  source.onended = () => {
    setTimeout(cleanupNodes, VOICE_EFFECT_SETTINGS.reverbSeconds * 1000 + 250);
  };
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

export function speakText(text, audioSettings = DEFAULT_AUDIO_SETTINGS) {
  const volume = audioVolume(audioSettings, "voice");
  if (volume <= 0) return;
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 1.05;
  utterance.volume = volume;
  window.speechSynthesis.speak(utterance);
}
