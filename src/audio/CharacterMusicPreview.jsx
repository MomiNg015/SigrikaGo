import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { BGM_START_DELAY_SECONDS } from "../shared/audioScheduling.js";
import { audioVolume } from "./audioSettings.js";
import { requestBackgroundMusicPause } from "./backgroundMusicPause.js";
import { browserAudioContextClass } from "./audioRuntime.js";

export function CharacterMusicPreview({ track, options = [], audioSettings, onTrackChange }) {
  const [status, setStatus] = useState("idle");
  const playerRef = useRef(createPreviewState());
  const releaseBackgroundPauseRef = useRef(null);
  const volume = audioVolume(audioSettings, "bgm");
  const selectable = options.length > 1;
  const title = track?.name ?? "No BGM";
  const playing = status === "playing";
  const loading = status === "loading";

  useEffect(() => {
    setPreviewVolume(playerRef.current, volume);
  }, [volume]);

  useEffect(() => {
    preloadPreviewTrack(playerRef.current, track);
  }, [track]);

  useEffect(() => {
    const state = playerRef.current;
    state.offset = 0;
    stopPreview(state);
    releaseBackgroundPause();
    setStatus("idle");
  }, [track?.id]);

  useEffect(() => () => {
    stopPreview(playerRef.current);
    releaseBackgroundPause();
  }, []);

  const label = useMemo(() => (playing ? "暂停角色 BGM" : "播放角色 BGM"), [playing]);

  async function togglePlayback() {
    if (!track || loading) return;
    const state = playerRef.current;
    if (playing) {
      pausePreview(state);
      releaseBackgroundPause();
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const release = requestBackgroundMusicPause();
    releaseBackgroundPauseRef.current = release;
    const started = await playPreview({ state, track, volume }).catch(() => false);
    if (started) {
      setStatus("playing");
    } else {
      releaseBackgroundPause();
      setStatus("error");
    }
  }

  function changeTrack(event) {
    onTrackChange?.(event.target.value);
  }

  function releaseBackgroundPause() {
    releaseBackgroundPauseRef.current?.();
    releaseBackgroundPauseRef.current = null;
  }

  return (
    <div
      className={`character-music-player is-${status}`}
      aria-label="角色 BGM 播放器"
      aria-busy={loading ? "true" : "false"}
    >
      <button
        className="character-music-toggle"
        type="button"
        aria-label={label}
        disabled={!track || loading}
        onClick={togglePlayback}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <span className="character-music-signal" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      {selectable ? (
        <span className="character-music-select-frame">
          <select className="character-music-select" value={track?.id ?? ""} onChange={changeTrack}>
            {options.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
        </span>
      ) : (
        <span className="character-music-name">{title}</span>
      )}
      <span className="character-music-status" aria-live="polite">
        {status === "error" ? "BGM 播放失败" : ""}
      </span>
    </div>
  );
}

export function createPreviewState() {
  return {
    active: null,
    bufferCache: new Map(),
    bufferPromises: new Map(),
    context: null,
    offset: 0,
    startedAt: 0
  };
}

export function preloadPreviewTrack(state, track) {
  const context = getPreviewAudioContext(state);
  if (!context || !track?.playback) return null;
  return loadPreviewBuffers(state, context, track.playback).catch(() => null);
}

export async function playPreview({ state, track, volume }) {
  const context = getPreviewAudioContext(state);
  if (!context || !track?.playback) return false;
  if (context.state === "suspended") await context.resume().catch(() => {});
  stopPreview(state, { keepOffset: true });
  const buffers = await loadPreviewBuffers(state, context, track.playback);
  const startAt = context.currentTime + BGM_START_DELAY_SECONDS;
  const gain = context.createGain();
  gain.gain.setValueAtTime(volume, startAt);
  gain.connect(context.destination);
  const sources = schedulePreviewSources({ context, playback: track.playback, buffers, startAt, offset: state.offset, destination: gain });
  state.active = { gain, sources };
  state.startedAt = startAt;
  return true;
}

export function pausePreview(state) {
  const context = state.context;
  if (context && state.active) {
    state.offset += Math.max(0, context.currentTime - state.startedAt);
  }
  stopPreview(state, { keepOffset: true });
}

export function stopPreview(state, { keepOffset = false } = {}) {
  if (!keepOffset) state.offset = 0;
  const active = state.active;
  state.active = null;
  if (!active) return;
  for (const source of active.sources) {
    try {
      source.stop();
    } catch {
      // Already stopped.
    }
  }
  try {
    active.gain.disconnect();
  } catch {
    // Already disconnected.
  }
}

function getPreviewAudioContext(state) {
  if (state.context) return state.context;
  const AudioContextClass = browserAudioContextClass();
  if (!AudioContextClass) return null;
  state.context = new AudioContextClass();
  return state.context;
}

function setPreviewVolume(state, volume) {
  if (!state.active || !state.context) return;
  state.active.gain.gain.setValueAtTime(volume, state.context.currentTime);
}

export async function loadPreviewBuffers(state, context, playback) {
  const sources = playback.mode === "intro-loop" ? [playback.introSrc, playback.loopSrc] : [playback.src];
  const entries = await Promise.all(sources.map(async (src) => [src, await loadPreviewBuffer(state, context, src)]));
  return Object.fromEntries(entries);
}

async function loadPreviewBuffer(state, context, src) {
  if (state.bufferCache.has(src)) return state.bufferCache.get(src);
  if (state.bufferPromises.has(src)) return state.bufferPromises.get(src);
  const promise = fetch(src)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => context.decodeAudioData(arrayBuffer))
    .then((buffer) => {
      state.bufferCache.set(src, buffer);
      return buffer;
    })
    .finally(() => {
      state.bufferPromises.delete(src);
    });
  state.bufferPromises.set(src, promise);
  return promise;
}

export function schedulePreviewSources({ context, playback, buffers, startAt, offset = 0, destination = null }) {
  if (playback.mode === "intro-loop") {
    const intro = buffers[playback.introSrc];
    const loop = buffers[playback.loopSrc];
    if (offset < intro.duration) {
      const introSource = createPreviewSource(context, intro, false, destination);
      introSource.start(startAt, offset);
      const loopSource = createPreviewSource(context, loop, true, destination);
      loopSource.start(startAt + intro.duration - offset);
      return [introSource, loopSource];
    }
    const loopSource = createPreviewSource(context, loop, true, destination);
    loopSource.start(startAt, loopOffset(offset - intro.duration, loop.duration));
    return [loopSource];
  }

  const buffer = buffers[playback.src];
  const source = createPreviewSource(context, buffer, Boolean(playback.loop), destination);
  source.start(startAt, playback.loop ? loopOffset(offset, buffer.duration) : Math.min(offset, buffer.duration));
  return [source];
}

function createPreviewSource(context, buffer, loop, destination = null) {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = loop;
  if (destination) source.connect(destination);
  return source;
}

function loopOffset(offset, duration) {
  if (!duration) return 0;
  return offset % duration;
}
