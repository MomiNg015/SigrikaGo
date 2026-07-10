import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import rough from "roughjs/bundled/rough.esm.js";
import { BGM_START_DELAY_SECONDS } from "../shared/audioScheduling.js";
import { audioVolume } from "./audioSettings.js";
import { requestBackgroundMusicPause } from "./backgroundMusicPause.js";
import { browserAudioContextClass } from "./audioRuntime.js";

const MARQUEE_START_PAUSE_MS = 1100;
const MARQUEE_END_PAUSE_MS = 900;
const MARQUEE_SPEED_PX_PER_SECOND = 28;

export function CharacterMusicPreview({
  characterId,
  slots = [],
  audioSettings,
  onTrackChange
}) {
  const componentId = useId().replaceAll(":", "");
  const [playbackState, setPlaybackState] = useState("idle");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState(slots[0]?.id ?? "base");
  const [trackOverrides, setTrackOverrides] = useState({});
  const [pendingSelections, setPendingSelections] = useState({});
  const [selectionErrors, setSelectionErrors] = useState({});
  const [playbackError, setPlaybackError] = useState("");
  const playerRef = useRef(createPreviewState());
  const playerElementRef = useRef(null);
  const titleTriggerRef = useRef(null);
  const sheetRef = useRef(null);
  const tabRefs = useRef(new Map());
  const playRequestRef = useRef(0);
  const previewIntentRef = useRef(0);
  const selectionRequestRef = useRef(new Map());
  const releaseBackgroundPauseRef = useRef(null);
  const playbackStateRef = useRef("idle");
  const previewTrackIdRef = useRef(null);
  const activeSlotIdRef = useRef(activeSlotId);
  const trackOverridesRef = useRef(trackOverrides);
  const volume = audioVolume(audioSettings, "bgm");
  const normalizedSlots = useMemo(() => slots.filter((slot) => slot?.id), [slots]);
  const activeSlot = normalizedSlots.find((slot) => slot.id === activeSlotId) ?? normalizedSlots[0] ?? null;
  const track = effectiveSlotTrack(activeSlot, trackOverrides);
  const selectable = normalizedSlots.length > 1 || (activeSlot?.options?.length ?? 0) > 1;
  const title = playbackError || track?.name || "无可用曲目";
  const playing = playbackState === "playing";
  const loading = playbackState === "loading";
  const sheetPosition = useFloatingSheetPosition({
    open: sheetOpen,
    anchorRef: playerElementRef,
    sheetRef
  });

  playbackStateRef.current = playbackState;
  activeSlotIdRef.current = activeSlot?.id ?? "";
  trackOverridesRef.current = trackOverrides;

  useEffect(() => {
    setPreviewVolume(playerRef.current, volume);
  }, [volume]);

  useEffect(() => {
    const firstSlotId = normalizedSlots[0]?.id ?? "base";
    activeSlotIdRef.current = firstSlotId;
    setActiveSlotId(firstSlotId);
    setTrackOverrides({});
    trackOverridesRef.current = {};
    setPendingSelections({});
    setSelectionErrors({});
    setPlaybackError("");
    setSheetOpen(false);
    invalidatePlayback({ releasePause: true });
  }, [characterId]);

  useEffect(() => {
    if (normalizedSlots.some((slot) => slot.id === activeSlotIdRef.current)) return;
    const firstSlotId = normalizedSlots[0]?.id ?? "base";
    activeSlotIdRef.current = firstSlotId;
    setActiveSlotId(firstSlotId);
  }, [normalizedSlots]);

  useEffect(() => {
    const nextOverrides = { ...trackOverridesRef.current };
    let changed = false;
    for (const slot of normalizedSlots) {
      if (nextOverrides[slot.id]?.id && nextOverrides[slot.id].id === slot.track?.id) {
        delete nextOverrides[slot.id];
        changed = true;
      }
    }
    if (!changed) return;
    trackOverridesRef.current = nextOverrides;
    setTrackOverrides(nextOverrides);
  }, [normalizedSlots]);

  useEffect(() => () => {
    playRequestRef.current += 1;
    previewIntentRef.current += 1;
    stopPreview(playerRef.current);
    releaseBackgroundPauseRef.current?.();
    releaseBackgroundPauseRef.current = null;
  }, []);

  useEffect(() => {
    if (!sheetOpen || typeof document === "undefined") return undefined;
    function dismissOnPointerDown(event) {
      if (playerElementRef.current?.contains(event.target) || sheetRef.current?.contains(event.target)) return;
      setSheetOpen(false);
    }
    function dismissOnEscape(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setSheetOpen(false);
      titleTriggerRef.current?.focus();
    }
    document.addEventListener("pointerdown", dismissOnPointerDown, true);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOnPointerDown, true);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [sheetOpen]);

  const label = useMemo(() => {
    if (loading) return "角色 BGM 加载中";
    if (playbackError) return "重试角色 BGM";
    return playing ? "暂停角色 BGM" : "播放角色 BGM";
  }, [loading, playbackError, playing]);

  async function togglePlayback() {
    if (!track || loading) return;
    const state = playerRef.current;
    if (playing) {
      playRequestRef.current += 1;
      pausePreview(state);
      releaseBackgroundPause();
      updatePlaybackState("idle");
      return;
    }
    await startTrack(track);
  }

  async function startTrack(nextTrack, { keepPause = false } = {}) {
    if (!nextTrack) return false;
    const state = playerRef.current;
    const requestId = playRequestRef.current + 1;
    playRequestRef.current = requestId;
    setPlaybackError("");
    if (previewTrackIdRef.current !== nextTrack.id) {
      state.offset = 0;
      stopPreview(state);
    }
    if (!keepPause) releaseBackgroundPause();
    ensureBackgroundPause();
    updatePlaybackState("loading");
    const started = await playPreview({
      state,
      track: nextTrack,
      volume,
      shouldStart: () => playRequestRef.current === requestId
    }).catch(() => false);
    if (playRequestRef.current !== requestId) return false;
    if (!started) {
      previewTrackIdRef.current = null;
      releaseBackgroundPause();
      setPlaybackError("播放失败 · 点击重试");
      updatePlaybackState("error");
      return false;
    }
    previewTrackIdRef.current = nextTrack.id;
    updatePlaybackState("playing");
    return true;
  }

  function prepareTrackSwitch({ continuePlayback }) {
    playRequestRef.current += 1;
    const state = playerRef.current;
    state.offset = 0;
    stopPreview(state);
    previewTrackIdRef.current = null;
    setPlaybackError("");
    if (continuePlayback) {
      ensureBackgroundPause();
      updatePlaybackState("loading");
    } else {
      releaseBackgroundPause();
      updatePlaybackState("idle");
    }
  }

  async function selectTrack(slot, nextTrack) {
    const currentTrack = effectiveSlotTrack(slot, trackOverridesRef.current);
    if (!nextTrack || currentTrack?.id === nextTrack.id) return;
    const slotRequestId = (selectionRequestRef.current.get(slot.id) ?? 0) + 1;
    selectionRequestRef.current.set(slot.id, slotRequestId);
    const intentId = previewIntentRef.current + 1;
    previewIntentRef.current = intentId;
    const continuePlayback = activeSlotIdRef.current === slot.id
      && ["playing", "loading"].includes(playbackStateRef.current);
    const previousOverride = trackOverridesRef.current[slot.id];
    setSlotOverride(slot.id, nextTrack);
    setSelectionErrors((current) => ({ ...current, [slot.id]: null }));
    setPendingSelections((current) => ({ ...current, [slot.id]: nextTrack.id }));
    if (continuePlayback) prepareTrackSwitch({ continuePlayback: true });

    try {
      await onTrackChange?.({ trackId: nextTrack.id, effectType: slot.effectType ?? "" });
      if (selectionRequestRef.current.get(slot.id) !== slotRequestId) return;
      setPendingSelections((current) => ({ ...current, [slot.id]: "" }));
      if (
        continuePlayback
        && previewIntentRef.current === intentId
        && activeSlotIdRef.current === slot.id
      ) {
        await startTrack(nextTrack, { keepPause: true });
      }
    } catch (error) {
      if (selectionRequestRef.current.get(slot.id) !== slotRequestId) return;
      setSlotOverride(slot.id, previousOverride);
      setPendingSelections((current) => ({ ...current, [slot.id]: "" }));
      setSelectionErrors((current) => ({
        ...current,
        [slot.id]: {
          message: error?.message || "保存失败，请重试",
          trackId: nextTrack.id
        }
      }));
      if (
        continuePlayback
        && previewIntentRef.current === intentId
        && activeSlotIdRef.current === slot.id
      ) {
        prepareTrackSwitch({ continuePlayback: false });
      }
    }
  }

  function activateSlot(nextSlot) {
    if (!nextSlot || nextSlot.id === activeSlotIdRef.current) return;
    const continuePlayback = ["playing", "loading"].includes(playbackStateRef.current);
    previewIntentRef.current += 1;
    activeSlotIdRef.current = nextSlot.id;
    setActiveSlotId(nextSlot.id);
    const nextTrack = effectiveSlotTrack(nextSlot, trackOverridesRef.current);
    if (continuePlayback && nextTrack) {
      prepareTrackSwitch({ continuePlayback: true });
      void startTrack(nextTrack, { keepPause: true });
    } else if (continuePlayback) {
      prepareTrackSwitch({ continuePlayback: false });
    }
  }

  function handleTabKeyDown(event, slotIndex) {
    let nextIndex = slotIndex;
    if (event.key === "ArrowRight") nextIndex = (slotIndex + 1) % normalizedSlots.length;
    else if (event.key === "ArrowLeft") nextIndex = (slotIndex - 1 + normalizedSlots.length) % normalizedSlots.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = normalizedSlots.length - 1;
    else return;
    event.preventDefault();
    const nextSlot = normalizedSlots[nextIndex];
    activateSlot(nextSlot);
    tabRefs.current.get(nextSlot.id)?.focus();
  }

  function retrySelection(slot) {
    const error = selectionErrors[slot.id];
    const retryTrack = slot.options?.find((option) => option.id === error?.trackId);
    if (retryTrack) void selectTrack(slot, retryTrack);
  }

  function setSlotOverride(slotId, nextTrack) {
    const nextOverrides = { ...trackOverridesRef.current };
    if (nextTrack) nextOverrides[slotId] = nextTrack;
    else delete nextOverrides[slotId];
    trackOverridesRef.current = nextOverrides;
    setTrackOverrides(nextOverrides);
  }

  function updatePlaybackState(nextState) {
    playbackStateRef.current = nextState;
    setPlaybackState(nextState);
  }

  function ensureBackgroundPause() {
    if (!releaseBackgroundPauseRef.current) {
      releaseBackgroundPauseRef.current = requestBackgroundMusicPause();
    }
  }

  function releaseBackgroundPause() {
    releaseBackgroundPauseRef.current?.();
    releaseBackgroundPauseRef.current = null;
  }

  function invalidatePlayback({ releasePause }) {
    playRequestRef.current += 1;
    previewIntentRef.current += 1;
    const state = playerRef.current;
    state.offset = 0;
    stopPreview(state);
    previewTrackIdRef.current = null;
    if (releasePause) releaseBackgroundPause();
    playbackStateRef.current = "idle";
    setPlaybackState("idle");
  }

  const portalTarget = typeof document !== "undefined"
    ? playerElementRef.current?.closest(".nested-modal-backdrop, .modal-backdrop")
      ?? playerElementRef.current?.closest(".app-shell")
      ?? document.body
    : null;
  const activeSelectedTrackId = track?.id ?? "";
  const liveMessage = loading
    ? `正在加载${track?.name ?? "角色音乐"}`
    : playbackError || selectionErrors[activeSlot?.id]?.message || "";

  return (
    <div
      ref={playerElementRef}
      className={`character-music-player ${loading ? "is-loading" : ""} ${playing ? "is-playing" : ""} ${playbackError ? "is-error" : ""}`}
      aria-label="角色 BGM 播放器"
      aria-busy={loading ? "true" : "false"}
    >
      <CharacterMusicSketch />
      <button
        className="character-music-toggle"
        type="button"
        aria-label={label}
        disabled={!track || loading}
        onClick={togglePlayback}
      >
        <PlaybackGlyph state={loading ? "loading" : playing ? "pause" : "play"} />
      </button>
      {selectable ? (
        <button
          ref={titleTriggerRef}
          className="character-music-title-trigger"
          type="button"
          aria-expanded={sheetOpen}
          aria-controls={`${componentId}-sheet`}
          aria-label={`${activeSlot?.label ?? "角色技能"}，当前曲目 ${track?.name ?? "无可用曲目"}，${sheetOpen ? "收起" : "打开"}曲目单`}
          onClick={() => setSheetOpen((open) => !open)}
        >
          <span className="character-music-slot-mark">{activeSlot?.shortLabel ?? "普通技"}</span>
          <MarqueeText className="character-music-name" text={title} active />
          <span className="character-music-chevron" aria-hidden="true" />
        </button>
      ) : (
        <span className="character-music-title-static">
          <span className="character-music-slot-mark">{activeSlot?.shortLabel ?? "普通技"}</span>
          <MarqueeText className="character-music-name" text={title} active />
        </span>
      )}
      <span className="character-music-live" aria-live="polite">{liveMessage}</span>
      {sheetOpen && portalTarget && createPortal(
        <div
          ref={sheetRef}
          id={`${componentId}-sheet`}
          className="character-music-sheet"
          style={sheetPosition}
          role="region"
          aria-label="角色技能曲目单"
        >
          {normalizedSlots.length > 1 && (
            <div className="character-music-tabs" role="tablist" aria-label="选择技能音乐槽位">
              {normalizedSlots.map((slot, index) => (
                <button
                  key={slot.id}
                  ref={(node) => {
                    if (node) tabRefs.current.set(slot.id, node);
                    else tabRefs.current.delete(slot.id);
                  }}
                  id={`${componentId}-tab-${index}`}
                  className="character-music-tab"
                  type="button"
                  role="tab"
                  aria-selected={slot.id === activeSlot?.id}
                  aria-controls={`${componentId}-panel`}
                  tabIndex={slot.id === activeSlot?.id ? 0 : -1}
                  onClick={() => activateSlot(slot)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
          <div
            id={`${componentId}-panel`}
            className="character-music-panel"
            role="tabpanel"
            aria-labelledby={normalizedSlots.length > 1
              ? `${componentId}-tab-${Math.max(0, normalizedSlots.findIndex((slot) => slot.id === activeSlot?.id))}`
              : undefined}
            aria-label={normalizedSlots.length === 1 ? activeSlot?.label : undefined}
          >
            <div className="character-music-options" role="listbox" aria-label={`${activeSlot?.label ?? "角色技能"}曲目`}>
              {(activeSlot?.options ?? []).map((option) => (
                <TrackOptionButton
                  key={option.id}
                  option={option}
                  selected={option.id === activeSelectedTrackId}
                  pending={pendingSelections[activeSlot.id] === option.id}
                  onSelect={() => void selectTrack(activeSlot, option)}
                />
              ))}
            </div>
            {selectionErrors[activeSlot?.id] && (
              <button
                className="character-music-sheet-error"
                type="button"
                onClick={() => retrySelection(activeSlot)}
              >
                {selectionErrors[activeSlot.id].message} · 点击重试
              </button>
            )}
          </div>
        </div>,
        portalTarget
      )}
    </div>
  );
}

function PlaybackGlyph({ state }) {
  if (state === "loading") {
    return (
      <span className="character-music-glyph is-loading" aria-hidden="true">
        <span /><span />
      </span>
    );
  }
  if (state === "pause") {
    return (
      <span className="character-music-glyph is-pause" aria-hidden="true">
        <span /><span />
      </span>
    );
  }
  return <span className="character-music-glyph is-play" aria-hidden="true" />;
}

function TrackOptionButton({ option, selected, pending, onSelect }) {
  const [active, setActive] = useState(false);
  return (
    <button
      className={`character-music-option ${selected ? "is-selected" : ""} ${pending ? "is-pending" : ""}`}
      type="button"
      role="option"
      aria-selected={selected}
      aria-label={`${option.name}${selected ? "，已选择" : ""}`}
      title={option.name}
      onClick={onSelect}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      <span className="character-music-option-check" aria-hidden="true">{selected ? "✓" : ""}</span>
      <MarqueeText className="character-music-option-name" text={option.name} active={active} />
      {pending && <span className="character-music-option-pending" aria-hidden="true">•••</span>}
    </button>
  );
}

export function MarqueeText({ text, active, className = "" }) {
  const viewportRef = useRef(null);
  const contentRef = useRef(null);
  const animationRef = useRef(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return undefined;
    function measure() {
      setOverflowing(content.scrollWidth - viewport.clientWidth > 1);
    }
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(content);
    return () => observer.disconnect();
  }, [text]);

  useEffect(() => {
    animationRef.current?.cancel();
    animationRef.current = null;
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!active || !overflowing || !viewport || !content || typeof content.animate !== "function") return undefined;
    const reducedMotion = typeof window !== "undefined"
      && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return undefined;
    const distance = Math.max(0, content.scrollWidth - viewport.clientWidth);
    const travelMs = Math.max(650, distance / MARQUEE_SPEED_PX_PER_SECOND * 1000);
    const duration = MARQUEE_START_PAUSE_MS + travelMs + MARQUEE_END_PAUSE_MS;
    animationRef.current = content.animate([
      { transform: "translateX(0)", offset: 0 },
      { transform: "translateX(0)", offset: MARQUEE_START_PAUSE_MS / duration },
      { transform: `translateX(-${distance}px)`, offset: (MARQUEE_START_PAUSE_MS + travelMs) / duration },
      { transform: `translateX(-${distance}px)`, offset: 1 }
    ], { duration, iterations: Infinity, easing: "linear" });
    return () => {
      animationRef.current?.cancel();
      animationRef.current = null;
    };
  }, [active, overflowing, text]);

  return (
    <span className={`${className} character-music-marquee ${overflowing ? "is-overflowing" : ""}`} title={text}>
      <span ref={viewportRef} className="character-music-marquee-viewport">
        <span ref={contentRef} className="character-music-marquee-content">{text}</span>
      </span>
    </span>
  );
}

function useFloatingSheetPosition({ open, anchorRef, sheetRef }) {
  const [position, setPosition] = useState({ visibility: "hidden" });

  useEffect(() => {
    if (!open || typeof window === "undefined") return undefined;
    let frameId = 0;
    function update() {
      const anchor = anchorRef.current;
      const sheet = sheetRef.current;
      if (!anchor || !sheet) return;
      const margin = 12;
      const gap = 8;
      const anchorRect = anchor.getBoundingClientRect();
      const width = Math.min(252, Math.max(0, window.innerWidth - margin * 2));
      const left = Math.min(
        window.innerWidth - width - margin,
        Math.max(margin, anchorRect.right - width)
      );
      const availableBelow = window.innerHeight - anchorRect.bottom - gap - margin;
      const availableAbove = anchorRect.top - gap - margin;
      const maxHeight = Math.max(132, Math.min(300, Math.max(availableBelow, availableAbove)));
      const measuredHeight = Math.min(sheet.offsetHeight || maxHeight, maxHeight);
      const top = availableBelow >= Math.min(measuredHeight, 180)
        ? anchorRect.bottom + gap
        : Math.max(margin, anchorRect.top - measuredHeight - gap);
      setPosition({ left, top, width, maxHeight, visibility: "visible" });
    }
    function scheduleUpdate() {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(update);
    }
    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
    };
  }, [anchorRef, open, sheetRef]);

  return position;
}

function effectiveSlotTrack(slot, overrides) {
  if (!slot) return null;
  return overrides?.[slot.id] ?? slot.track ?? null;
}

export function CharacterMusicSketch() {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.replaceChildren();
    const rc = rough.svg(svg, { options: { seed: 27 } });
    const frame = rc.rectangle(3, 4, 182, 36, {
      roughness: 1.4,
      bowing: 1.1,
      stroke: "#2f251f",
      strokeWidth: 1.9,
      fill: "none"
    });
    const buttonRing = rc.ellipse(24, 22, 38, 36, {
      roughness: 1.35,
      bowing: 1.05,
      stroke: "#2f251f",
      strokeWidth: 1.8,
      fill: "#ff9ebb",
      fillStyle: "solid"
    });
    const titleRuleTop = rc.line(50, 11, 177, 10, {
      roughness: 0.95,
      stroke: "#71a9bf",
      strokeWidth: 0.9
    });
    const titleRuleBottom = rc.line(50, 33, 177, 32, {
      roughness: 1.05,
      stroke: "#f0c35d",
      strokeWidth: 1.1
    });
    const tape = rc.line(8, 39, 179, 38, {
      roughness: 1.25,
      stroke: "#9c7b58",
      strokeWidth: 0.8
    });
    svg.append(frame, buttonRing, titleRuleTop, titleRuleBottom, tape);
  }, []);

  return (
    <svg
      ref={svgRef}
      className="character-music-sketch"
      viewBox="0 0 188 44"
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

export async function playPreview({ state, track, volume, shouldStart = () => true }) {
  const context = getPreviewAudioContext(state);
  if (!context || !track?.playback) return false;
  if (context.state === "suspended") await context.resume().catch(() => {});
  const buffers = await loadPreviewBuffers(state, context, track.playback);
  if (!shouldStart()) return false;
  stopPreview(state, { keepOffset: true });
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
