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

  useEffect(() => subscribeBackgroundMusicPause((paused) => {
    const state = playerRef.current;
    state.pauseRequested = paused;
    if (paused) {
      pauseBackgroundPlayback(state);
    } else {
      resumeBackgroundContextWithFallback(state);
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
      fadeOutBackgroundPlayers(state);
      return () => {};
    }

    const context = getBackgroundAudioContext(state);
    resumeBackgroundContextWithFallback(state);
    state.baseVolume = volume;
    state.currentTrack = track;
    state.offset = 0;
    scheduleBackgroundTrack({ state, context, track, generation }).catch(() => {});

    return () => {};
  }, [trackKey]);

  return null;
}

export function recoverBackgroundPlayback(state) {
  resumeBackgroundContextWithFallback(state);
  if (state.pauseRequested) return;
  if (!state.currentTrack) return;
  if (state.active.length > 0) return;
  const context = getBackgroundAudioContext(state);
  if (!context) return;
  state.generation += 1;
  const generation = state.generation;
  scheduleBackgroundTrack({ state, context, track: state.currentTrack, generation }).catch(() => {});
}

function getBackgroundAudioContext(state) {
  if (state.context) return state.context;
  const AudioContextClass = browserAudioContextClass();
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
  const schedule = createPlaybackSchedule({ playback: track.playback, buffers, startAt, offset: state.offset });
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

async function loadBackgroundBuffer(state, context, src) {
  if (state.bufferCache.has(src)) return state.bufferCache.get(src);
  const response = await fetch(src);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = await context.decodeAudioData(arrayBuffer);
  state.bufferCache.set(src, buffer);
  return buffer;
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
  if (!context || state.active.length === 0) return;
  state.offset += Math.max(0, context.currentTime - state.startedAt);
  stopBackgroundPlayers(state);
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
  return currentDuckedBackgroundVolume(state.baseVolume);
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

function stopBackgroundPlayers(state) {
  const previous = state.active;
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
