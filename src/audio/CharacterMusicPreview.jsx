import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, Pause, Play } from "lucide-react";
import rough from "roughjs/bundled/rough.esm.js";
import { BGM_START_DELAY_SECONDS } from "../shared/audioScheduling.js";
import { audioVolume } from "./audioSettings.js";
import { requestBackgroundMusicPause } from "./backgroundMusicPause.js";
import { browserAudioContextClass } from "./audioRuntime.js";

export function CharacterMusicPreview({ track, options = [], audioSettings, onTrackChange }) {
  const [playbackState, setPlaybackState] = useState("idle");
  const playerRef = useRef(createPreviewState());
  const playRequestRef = useRef(0);
  const releaseBackgroundPauseRef = useRef(null);
  const volume = audioVolume(audioSettings, "bgm");
  const selectable = options.length > 1;
  const title = track?.name ?? "No BGM";
  const playing = playbackState === "playing";
  const loading = playbackState === "loading";

  useEffect(() => {
    setPreviewVolume(playerRef.current, volume);
  }, [volume]);

  useEffect(() => {
    const state = playerRef.current;
    playRequestRef.current += 1;
    state.offset = 0;
    stopPreview(state);
    releaseBackgroundPause();
    setPlaybackState("idle");
  }, [track?.id]);

  useEffect(() => () => {
    playRequestRef.current += 1;
    stopPreview(playerRef.current);
    releaseBackgroundPause();
  }, []);

  const label = useMemo(() => {
    if (loading) return "角色 BGM 加载中";
    return playing ? "暂停角色 BGM" : "播放角色 BGM";
  }, [loading, playing]);

  async function togglePlayback() {
    if (!track || loading) return;
    const state = playerRef.current;
    if (playing) {
      playRequestRef.current += 1;
      pausePreview(state);
      releaseBackgroundPause();
      setPlaybackState("idle");
      return;
    }
    const requestId = playRequestRef.current + 1;
    playRequestRef.current = requestId;
    setPlaybackState("loading");
    const release = requestBackgroundMusicPause();
    releaseBackgroundPauseRef.current = release;
    const started = await playPreview({ state, track, volume }).catch(() => false);
    if (playRequestRef.current !== requestId) {
      stopPreview(state);
      return;
    }
    if (started) {
      setPlaybackState("playing");
    } else {
      releaseBackgroundPause();
      setPlaybackState("idle");
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
    <div className={`character-music-player ${loading ? "is-loading" : ""} ${playing ? "is-playing" : ""}`} aria-label="角色 BGM 播放器" aria-busy={loading ? "true" : "false"}>
      <CharacterMusicSketch />
      <button
        className="character-music-toggle"
        type="button"
        aria-label={label}
        disabled={!track || loading}
        onClick={togglePlayback}
      >
        {loading ? <LoaderCircle size={16} /> : playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
      {selectable ? (
        <select className="character-music-select" value={track?.id ?? ""} onChange={changeTrack}>
          {options.map((option) => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </select>
      ) : (
        <span className="character-music-name">{title}</span>
      )}
    </div>
  );
}

export function CharacterMusicSketch() {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.replaceChildren();
    const rc = rough.svg(svg, { options: { seed: 27 } });
    const frame = rc.rectangle(3, 4, 182, 30, {
      roughness: 1.55,
      bowing: 1.1,
      stroke: "#2f251f",
      strokeWidth: 1.9,
      fill: "none"
    });
    const buttonRing = rc.ellipse(22, 19, 33, 30, {
      roughness: 1.45,
      bowing: 1.05,
      stroke: "#2f251f",
      strokeWidth: 1.8,
      fill: "#ff9ebb",
      fillStyle: "solid"
    });
    const topRule = rc.line(50, 12, 176, 11, {
      roughness: 1.1,
      stroke: "#71a9bf",
      strokeWidth: 0.9
    });
    const titleRule = rc.line(50, 25, 128, 24, {
      roughness: 1.2,
      stroke: "#f0c35d",
      strokeWidth: 1.3
    });
    const waveform = rc.curve([[130, 22], [138, 13], [146, 25], [154, 16], [162, 21], [170, 14], [179, 20]], {
      roughness: 1.25,
      stroke: "#d86791",
      strokeWidth: 1.2
    });
    const tape = rc.line(8, 32, 178, 31, {
      roughness: 1.4,
      stroke: "#9c7b58",
      strokeWidth: 0.8
    });
    svg.append(frame, buttonRing, topRule, titleRule, waveform, tape);
  }, []);

  return (
    <svg
      ref={svgRef}
      className="character-music-sketch"
      viewBox="0 0 188 38"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    />
  );
}

export function createPreviewState() {
  return {
    active: null,
    bufferCache: new Map(),
    context: null,
    offset: 0,
    startedAt: 0
  };
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

async function loadPreviewBuffers(state, context, playback) {
  const sources = playback.mode === "intro-loop" ? [playback.introSrc, playback.loopSrc] : [playback.src];
  const entries = await Promise.all(sources.map(async (src) => [src, await loadPreviewBuffer(state, context, src)]));
  return Object.fromEntries(entries);
}

async function loadPreviewBuffer(state, context, src) {
  if (state.bufferCache.has(src)) return state.bufferCache.get(src);
  const response = await fetch(src);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = await context.decodeAudioData(arrayBuffer);
  state.bufferCache.set(src, buffer);
  return buffer;
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
