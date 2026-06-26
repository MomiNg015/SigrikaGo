import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, Pause, Play } from "lucide-react";
import { BGM_START_DELAY_SECONDS, createPlaybackKey } from "../shared/audioScheduling.js";
import { audioVolume } from "./audioSettings.js";
import { requestBackgroundMusicPause } from "./backgroundMusicPause.js";
import { browserAudioContextClass } from "./audioRuntime.js";

const PREVIEW_STATUS = {
  idle: "idle",
  loading: "loading",
  playing: "playing",
  error: "error"
};

export function CharacterMusicPreview({ track, options = [], audioSettings, onTrackChange }) {
  const [status, setStatus] = useState(PREVIEW_STATUS.idle);
  const playerRef = useRef(createPreviewState());
  const releaseBackgroundPauseRef = useRef(null);
  const playRequestRef = useRef(0);
  const volume = audioVolume(audioSettings, "bgm");
  const selectable = options.length > 1;
  const title = track?.name ?? "No BGM";
  const playbackKey = useMemo(() => createPlaybackKey(track), [track]);
  const playing = status === PREVIEW_STATUS.playing;
  const loading = status === PREVIEW_STATUS.loading;
  const statusText = previewStatusText(status);

  useEffect(() => {
    setPreviewVolume(playerRef.current, volume);
  }, [volume]);

  useEffect(() => {
    const state = playerRef.current;
    state.generation += 1;
    state.offset = 0;
    stopPreview(state);
    releaseBackgroundPause();
    setStatus(PREVIEW_STATUS.idle);

    if (!track?.playback) return undefined;

    let cancelled = false;
    const generation = state.generation;
    preloadPreview({ state, track }).then((ready) => {
      if (cancelled || state.generation !== generation) return;
      if (!ready) setStatus(PREVIEW_STATUS.error);
    });

    return () => {
      cancelled = true;
    };
  }, [playbackKey]);

  useEffect(() => () => {
    playRequestRef.current += 1;
    stopPreview(playerRef.current);
    releaseBackgroundPause();
  }, []);

  const label = useMemo(() => {
    if (loading) return "\u6b63\u5728\u51c6\u5907\u89d2\u8272 BGM";
    if (playing) return "\u6682\u505c\u89d2\u8272 BGM";
    if (status === PREVIEW_STATUS.error) return "\u91cd\u8bd5\u64ad\u653e\u89d2\u8272 BGM";
    return "\u64ad\u653e\u89d2\u8272 BGM";
  }, [loading, playing, status]);

  async function togglePlayback() {
    if (!track || loading) return;
    const state = playerRef.current;
    if (playing) {
      playRequestRef.current += 1;
      pausePreview(state);
      releaseBackgroundPause();
      setStatus(PREVIEW_STATUS.idle);
      return;
    }

    const requestId = playRequestRef.current + 1;
    playRequestRef.current = requestId;
    const generation = state.generation;
    setStatus(PREVIEW_STATUS.loading);
    releaseBackgroundPause();
    const release = requestBackgroundMusicPause();
    releaseBackgroundPauseRef.current = release;
    const started = await playPreview({ state, track, volume, generation }).catch(() => false);
    if (playRequestRef.current !== requestId || state.generation !== generation) {
      releaseBackgroundPause();
      if (started) stopPreview(state);
      return;
    }
    if (started) {
      setStatus(PREVIEW_STATUS.playing);
    } else {
      releaseBackgroundPause();
      setStatus(PREVIEW_STATUS.error);
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
      data-preview-status={status}
      aria-label={"\u89d2\u8272 BGM \u64ad\u653e\u5668"}
    >
      <button
        className="character-music-toggle"
        type="button"
        aria-label={label}
        aria-busy={loading || undefined}
        disabled={!track || loading}
        onClick={togglePlayback}
      >
        {loading ? <LoaderCircle size={17} /> : playing ? <Pause size={17} /> : <Play size={17} />}
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
      <span className="character-music-status" aria-live="polite">{statusText}</span>
    </div>
  );
}

export function createPreviewState() {
  return {
    active: null,
    bufferCache: new Map(),
    bufferPromises: new Map(),
    context: null,
    generation: 0,
    offset: 0,
    startedAt: 0
  };
}

export async function preloadPreview({ state, track }) {
  const context = getPreviewAudioContext(state);
  if (!context || !track?.playback) return false;
  try {
    await loadPreviewBuffers(state, context, track.playback);
    return true;
  } catch {
    return false;
  }
}

export async function playPreview({ state, track, volume, generation = state.generation }) {
  const context = getPreviewAudioContext(state);
  if (!context || !track?.playback) return false;
  if (context.state === "suspended") await context.resume().catch(() => {});
  const buffers = await loadPreviewBuffers(state, context, track.playback);
  if (state.generation !== generation) return false;
  stopPreview(state, { keepOffset: true });
  const startAt = context.currentTime + BGM_START_DELAY_SECONDS;
  const gain = context.createGain();
  gain.gain.setValueAtTime(volume, startAt);
  gain.connect(context.destination);
  const sources = schedulePreviewSources({
    context,
    playback: track.playback,
    buffers,
    startAt,
    offset: state.offset,
    destination: gain
  });
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

async function loadPreviewBuffers(state, context, playback) {
  const sources = playback.mode === "intro-loop" ? [playback.introSrc, playback.loopSrc] : [playback.src];
  const entries = await Promise.all(sources.map(async (src) => [src, await loadPreviewBuffer(state, context, src)]));
  return Object.fromEntries(entries);
}

export async function loadPreviewBuffer(state, context, src) {
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

function previewStatusText(status) {
  if (status === PREVIEW_STATUS.loading) return "\u51c6\u5907\u4e2d";
  if (status === PREVIEW_STATUS.playing) return "\u64ad\u653e\u4e2d";
  if (status === PREVIEW_STATUS.error) return "\u52a0\u8f7d\u5931\u8d25";
  return "\u5c31\u7eea";
}
