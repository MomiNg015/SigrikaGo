import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { requestBackgroundMusicDuck } from "../../audio/backgroundDucking.js";
import { playEffectSound, preloadEffectSound } from "../../audio/effectPlayback.js";
import { AEMEATH_RECRUITMENT_TIMING } from "../../shared/recruitment.js";

const FRAME_INTERVAL_MS = 50;

export default function RecruitmentCinematicOverlay({
  audioSettings,
  task,
  targetRef,
  onComplete,
  onElapsedChange,
  onInteractionLockChange,
  onInterrupt
}) {
  const [target, setTarget] = useState({ x: 0, y: 0 });
  const interruptedRef = useRef(false);
  const completedRef = useRef(false);
  const releaseDuckRef = useRef(null);

  useLayoutEffect(() => {
    const updateTarget = () => {
      const rect = targetRef.current?.getBoundingClientRect?.();
      setTarget({
        x: rect ? rect.left + (rect.width / 2) : window.innerWidth / 2,
        y: rect ? Math.max(72, rect.top - 62) : window.innerHeight / 2
      });
    };
    updateTarget();
    const resizeObserver = typeof ResizeObserver === "function" && targetRef.current
      ? new ResizeObserver(updateTarget)
      : null;
    resizeObserver?.observe(targetRef.current);
    window.addEventListener("resize", updateTarget);
    window.visualViewport?.addEventListener("resize", updateTarget);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateTarget);
      window.visualViewport?.removeEventListener("resize", updateTarget);
    };
  }, [targetRef, task.id]);

  useEffect(() => {
    interruptedRef.current = false;
    completedRef.current = false;
    onElapsedChange?.(0);
    onInteractionLockChange?.(true);
    document.body.classList.add("recruitment-cinematic-locked");

    const flightSoundUrl = task.cinematic?.flightSoundUrl ?? "";
    const flashSoundUrl = task.cinematic?.flashSoundUrl ?? "";
    if (flightSoundUrl) preloadEffectSound(flightSoundUrl);
    if (flashSoundUrl) preloadEffectSound(flashSoundUrl);

    const startedAt = performance.now();
    let animationFrameId = null;
    let lastFrameAt = -FRAME_INTERVAL_MS;
    const paintElapsed = (now) => {
      const elapsedMs = Math.min(AEMEATH_RECRUITMENT_TIMING.unlockAtMs, now - startedAt);
      if (elapsedMs - lastFrameAt >= FRAME_INTERVAL_MS || elapsedMs >= AEMEATH_RECRUITMENT_TIMING.unlockAtMs) {
        lastFrameAt = elapsedMs;
        onElapsedChange?.(elapsedMs);
      }
      if (!completedRef.current && !interruptedRef.current && elapsedMs < AEMEATH_RECRUITMENT_TIMING.unlockAtMs) {
        animationFrameId = window.requestAnimationFrame(paintElapsed);
      }
    };
    animationFrameId = window.requestAnimationFrame(paintElapsed);

    const duckTimer = window.setTimeout(() => {
      if (interruptedRef.current || completedRef.current) return;
      releaseDuckRef.current = requestBackgroundMusicDuck({ ratio: 0.15, attackMs: 350, releaseMs: 500 });
    }, AEMEATH_RECRUITMENT_TIMING.darkenAtMs);
    const flightSoundTimer = window.setTimeout(() => {
      if (!interruptedRef.current && flightSoundUrl) playEffectSound(flightSoundUrl, audioSettings);
    }, AEMEATH_RECRUITMENT_TIMING.flightAtMs);
    const flashSoundTimer = window.setTimeout(() => {
      if (!interruptedRef.current && flashSoundUrl) playEffectSound(flashSoundUrl, audioSettings);
    }, AEMEATH_RECRUITMENT_TIMING.concealedSwapAtMs);
    const completeTimer = window.setTimeout(() => {
      if (interruptedRef.current) return;
      completedRef.current = true;
      releaseBackgroundDuck();
      onElapsedChange?.(AEMEATH_RECRUITMENT_TIMING.unlockAtMs);
      onInteractionLockChange?.(false);
      document.body.classList.remove("recruitment-cinematic-locked");
      onComplete?.();
    }, AEMEATH_RECRUITMENT_TIMING.unlockAtMs);

    const interrupt = () => {
      if (interruptedRef.current || completedRef.current) return;
      interruptedRef.current = true;
      releaseBackgroundDuck();
      onInteractionLockChange?.(false);
      document.body.classList.remove("recruitment-cinematic-locked");
      onInterrupt?.({ keepalive: true });
    };
    const interruptWhenHidden = () => {
      if (document.visibilityState === "hidden") interrupt();
    };
    const blockKeyInput = (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    };
    document.addEventListener("visibilitychange", interruptWhenHidden);
    window.addEventListener("pagehide", interrupt);
    window.addEventListener("offline", interrupt);
    window.addEventListener("keydown", blockKeyInput, true);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(duckTimer);
      window.clearTimeout(flightSoundTimer);
      window.clearTimeout(flashSoundTimer);
      window.clearTimeout(completeTimer);
      document.removeEventListener("visibilitychange", interruptWhenHidden);
      window.removeEventListener("pagehide", interrupt);
      window.removeEventListener("offline", interrupt);
      window.removeEventListener("keydown", blockKeyInput, true);
      releaseBackgroundDuck();
      onInteractionLockChange?.(false);
      document.body.classList.remove("recruitment-cinematic-locked");
      if (!completedRef.current && !interruptedRef.current) onInterrupt?.({ keepalive: true });
    };
  }, [audioSettings, onComplete, onElapsedChange, onInteractionLockChange, onInterrupt, task.cinematic, task.id]);

  function releaseBackgroundDuck() {
    releaseDuckRef.current?.();
    releaseDuckRef.current = null;
  }

  if (typeof document === "undefined") return null;
  const spriteSheetUrl = String(task.cinematic?.spriteSheetUrl ?? "").trim();
  const spriteImageUrl = String(task.cinematic?.spriteImageUrl ?? "").trim();
  return createPortal(
    <div
      className="recruitment-cinematic-overlay"
      data-cinematic-id={task.cinematic?.id}
      style={{
        "--recruitment-cinematic-target-x": `${target.x}px`,
        "--recruitment-cinematic-target-y": `${target.y}px`
      }}
      aria-hidden="true"
    >
      <span className="recruitment-cinematic-dimmer" />
      {spriteSheetUrl ? (
        <span className="recruitment-cinematic-sprite" data-sprite-mode="atlas">
          <span
            className="recruitment-cinematic-sprite-frame recruitment-cinematic-sprite-flight-frame"
            style={{ backgroundImage: `url(${JSON.stringify(spriteSheetUrl)})` }}
          />
          <span
            className="recruitment-cinematic-sprite-frame recruitment-cinematic-sprite-wave-frame"
            style={{ backgroundImage: `url(${JSON.stringify(spriteSheetUrl)})` }}
          />
        </span>
      ) : spriteImageUrl ? (
        <span className="recruitment-cinematic-sprite" data-sprite-mode="image">
          <img src={spriteImageUrl} alt="" decoding="sync" />
        </span>
      ) : null}
      <span className="recruitment-cinematic-flash" />
    </div>,
    document.body
  );
}
