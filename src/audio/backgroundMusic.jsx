import { useEffect, useRef } from "react";
import {
  BGM_FADE_SECONDS,
  BGM_START_DELAY_SECONDS,
  createPlaybackKey,
  createPlaybackSchedule,
  createVolumeRamp
} from "../shared/audioScheduling.js";
import { audioVolume } from "./audioSettings.js";
import { browserAudioContextClass } from "./audioRuntime.js";
import { currentDuckedBackgroundVolume, subscribeBackgroundDuck } from "./backgroundDucking.js";
import { subscribeBackgroundMusicPause } from "./backgroundMusicPause.js";

export function BackgroundMusic({ track, audioSettings, resumeSignal = 0 }) {
  const playerRef = useRef({
    context: null,
    active: [],
    baseVolume: 0,
    retry: null,
    generation: 0,
    currentTrack: null,
    bufferCache: new Map(),
    failedSources: new Map(),
    htmlFallback: null,
    offset: 0,
    startedAt: 0,
    pauseRequested: false
  });
  const volume = audioVolume(audioSettings, "bgm");
  const trackKey = createPlaybackKey(track);

  useEffect(() => {
    setBackgroundBaseVolume(playerRef.current, volume);
  }, [volume]);

  useEffect(() => {
    const state = playerRef.current;
    const refresh = () => setBackgroundVolume(state);
    return subscribeBackgroundDuck(refresh);
  }, []);

  useEffect(() => installBackgroundResumeTriggers(playerRef.current), []);

  useEffect(() => () => {
    stopBackgroundPlayback(playerRef.current);
  }, []);

  useEffect(() => subscribeBackgroundMusicPause((paused) => {
    const state = playerRef.current;
    state.pauseRequested = paused;
    if (paused) {
      pauseBackgroundPlayback(state);
    } else {
      primeBackgroundAudioRuntime(state);
      recoverBackgroundPlayback(state);
    }
  }), []);

  useEffect(() => {
    recoverBackgroundPlayback(playerRef.current);
  }, [resumeSignal]);

  useEffect(() => {
    const state = playerRef.current;
    state.generation += 1;
    const generation = state.generation;
    if (!track) {
      state.currentTrack = null;
      state.offset = 0;
      stopBackgroundHtmlFallback(state);
      fadeOutBackgroundPlayers(state);
      return () => {};
    }

    const context = getBackgroundAudioContext(state);
    primeBackgroundAudioRuntime(state);
    state.baseVolume = volume;
    state.currentTrack = track;
    state.offset = 0;
    scheduleBackgroundTrack({ state, context, track, generation }).catch((error) => {
      startBackgroundHtmlFallback(state, track, error);
    });

    return () => {};
  }, [trackKey]);

  return null;
}

export function recoverBackgroundPlayback(state) {
  if (state.pauseRequested) return;
  if (!state.currentTrack) return;
  state.active ??= [];
  if (state.active.length > 0) return;
  const context = primeBackgroundAudioRuntime(state);
  if (!context) {
    startBackgroundHtmlFallback(state, state.currentTrack);
    return;
  }
  state.generation += 1;
  const generation = state.generation;
  scheduleBackgroundTrack({ state, context, track: state.currentTrack, generation }).catch((error) => {
    startBackgroundHtmlFallback(state, state.currentTrack, error);
  });
}

export function primeBackgroundAudioRuntime(state) {
  if (state.pauseRequested) return state.context ?? null;
  const context = getBackgroundAudioContext(state);
  resumeBackgroundContextWithFallback(state);
  return context;
}

function getBackgroundAudioContext(state) {
  if (state.context) return state.context;
  const AudioContextClass = browserAudioContextClass();
  if (!AudioContextClass) return null;
  try {
    state.context = new AudioContextClass();
  } catch {
    state.context = null;
  }
  return state.context;
}

async function scheduleBackgroundTrack({ state, context, track, generation }) {
  if (!context) {
    startBackgroundHtmlFallback(state, state.currentTrack);
    return;
  }
  const sources = playbackSources(track.playback);
  const decodedEntries = await Promise.all(
    sources.map(async (src) => [src, await loadBackgroundBuffer(state, context, src)])
  );
  if (generation !== state.generation) return;

  const buffers = Object.fromEntries(decodedEntries);
  const startAt = context.currentTime + BGM_START_DELAY_SECONDS;
  const schedule = createPlaybackSchedule({ playback: track.playback, buffers, startAt, offset: state.offset });
  const gain = context.createGain();
  applyGainRamp(gain.gain, createVolumeRamp({ from: 0, to: currentBackgroundVolume(state), startAt }));
  gain.connect(context.destination);
  stopBackgroundHtmlFallback(state);
  fadeOutBackgroundPlayers(state);

  const sourcesToStop = [];
  for (const event of schedule) {
    const source = context.createBufferSource();
    source.buffer = buffers[event.src];
    source.loop = event.loop;
    source.connect(gain);
    source.start(event.startAt, event.offset ?? 0);
    sourcesToStop.push(source);
  }

  state.startedAt = startAt;
  state.active.push({ gain, sources: sourcesToStop });
}

function playbackSources(playback) {
  if (playback.mode === "intro-loop") return [playback.introSrc, playback.loopSrc];
  return [playback.src];
}

function recordBackgroundSourceFailure(state, src, error) {
  state.failedSources ??= new Map();
  state.failedSources.set(src, {
    message: error?.message ?? "Failed to load background music",
    status: error?.status ?? null,
    at: Date.now()
  });
}

export async function loadBackgroundBuffer(state, context, src) {
  if (state.bufferCache.has(src)) return state.bufferCache.get(src);
  try {
    const response = await fetch(src);
    if (response?.ok === false) {
      const error = new Error(`Failed to load background music: ${src}`);
      error.status = response.status;
      throw error;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await context.decodeAudioData(arrayBuffer);
    state.bufferCache.set(src, buffer);
    state.failedSources?.delete?.(src);
    return buffer;
  } catch (error) {
    recordBackgroundSourceFailure(state, src, error);
    throw error;
  }
}

function startBackgroundHtmlFallback(state, track) {
  if (!track || typeof Audio === "undefined" || state.pauseRequested) return;
  const src = htmlFallbackSource(track.playback);
  if (!src) return;
  if (state.htmlFallback?.src === src) {
    state.htmlFallback.audio.volume = currentBackgroundVolume(state);
    return;
  }
  stopBackgroundHtmlFallback(state);
  const audio = new Audio(src);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = currentBackgroundVolume(state);
  state.htmlFallback = { audio, src };
  audio.play().catch(() => {});
}

function htmlFallbackSource(playback) {
  if (playback.mode === "intro-loop") return playback.loopSrc || playback.introSrc;
  return playback.src;
}

function stopBackgroundHtmlFallback(state) {
  const fallback = state.htmlFallback;
  state.htmlFallback = null;
  if (!fallback) return;
  try {
    fallback.audio.pause();
  } catch {
    // HTMLAudioElement may be released by the browser during page lifecycle changes.
  }
}

export function resumeBackgroundContextWithFallback(state) {
  if (state.pauseRequested) return;
  const context = state.context;
  if (!context || context.state !== "suspended") return;
  context.resume()
    .then(() => {
      if (context.state === "suspended") installBackgroundResumeRetry(state, context);
    })
    .catch(() => installBackgroundResumeRetry(state, context));
}

export function pauseBackgroundPlayback(state) {
  const context = state.context;
  stopBackgroundHtmlFallback(state);
  state.active ??= [];
  if (!context || state.active.length === 0) return;
  state.offset += Math.max(0, context.currentTime - state.startedAt);
  stopBackgroundPlayers(state);
}

export function stopBackgroundPlayback(state) {
  state.generation = (state.generation ?? 0) + 1;
  state.currentTrack = null;
  state.offset = 0;
  stopBackgroundHtmlFallback(state);
  stopBackgroundPlayers(state);
  clearBackgroundResumeRetry(state);
}

export function installBackgroundResumeTriggers(state) {
  if (typeof window === "undefined") return () => {};
  const doc = typeof document === "undefined" ? null : document;
  const retry = () => {
    primeBackgroundAudioRuntime(state);
    recoverBackgroundPlayback(state);
  };
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
    context.resume()
      .then(() => recoverBackgroundPlayback(state))
      .catch(() => installBackgroundResumeRetry(state, context));
  };
  window.addEventListener("pointerdown", state.retry, { once: true });
  window.addEventListener("keydown", state.retry, { once: true });
  window.addEventListener("touchstart", state.retry, { once: true });
}

function clearBackgroundResumeRetry(state) {
  if (!state.retry || typeof window === "undefined") {
    state.retry = null;
    return;
  }
  window.removeEventListener("pointerdown", state.retry);
  window.removeEventListener("keydown", state.retry);
  window.removeEventListener("touchstart", state.retry);
  state.retry = null;
}

function setBackgroundBaseVolume(state, volume) {
  state.baseVolume = volume;
  setBackgroundVolume(state);
}

function setBackgroundVolume(state) {
  const context = state.context;
  if (state.htmlFallback?.audio) state.htmlFallback.audio.volume = currentBackgroundVolume(state);
  if (!context) return;
  const now = context.currentTime;
  const volume = currentBackgroundVolume(state);
  for (const player of state.active ?? []) {
    player.gain.gain.cancelScheduledValues(now);
    player.gain.gain.setValueAtTime(player.gain.gain.value, now);
    player.gain.gain.linearRampToValueAtTime(volume, now + 0.12);
  }
}

function currentBackgroundVolume(state) {
  return currentDuckedBackgroundVolume(state.baseVolume);
}

function fadeOutBackgroundPlayers(state) {
  stopBackgroundHtmlFallback(state);
  const context = state.context;
  if (!context) {
    state.active = [];
    return;
  }
  const now = context.currentTime;
  const previous = state.active ?? [];
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

function stopBackgroundPlayers(state) {
  const previous = state.active ?? [];
  state.active = [];
  for (const player of previous) {
    for (const source of player.sources) {
      try {
        source.stop();
      } catch {
        // The source may already have ended naturally.
      }
    }
    try {
      player.gain.disconnect();
    } catch {
      // Already disconnected.
    }
  }
}

function applyGainRamp(param, ramp) {
  for (const event of ramp) {
    if (event.type === "set") param.setValueAtTime(event.value, event.time);
    if (event.type === "linear") param.linearRampToValueAtTime(event.value, event.time);
  }
}
