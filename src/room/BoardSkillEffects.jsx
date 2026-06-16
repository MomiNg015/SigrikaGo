import { useEffect, useRef } from "react";
import { skillEffectHasBoardEffect } from "../shared/skillEffectCatalog.js";
import { skillEffectTiming, SKILL_EFFECT_REDUCED_MOTION_MS } from "../shared/skillPresentation.js";
import { playRegisteredBoardSkillEffect } from "./boardSkillEffectRegistry.js";
import { boardPointCenter } from "./boardSkillEffectGeometry.js";
import {
  clearBoardSkillEffectSoundTimers,
  scheduleBoardSkillEffectSounds
} from "./boardSkillEffectSoundScheduler.js";
import { loadPixiModule, schedulePixiPrewarm } from "./pixiPrewarm.js";

export { SKILL_EFFECT_REDUCED_MOTION_MS };

export const reducedMotionQuery = "(prefers-reduced-motion: reduce)";


export { boardPointCenter };

export function effectTimingForPendingSkill(pendingSkill, options = {}) {
  const timing = skillEffectTiming(options);
  return {
    startDelayMs: Number(pendingSkill?.bannerDurationMs ?? timing.startDelayMs),
    durationMs: options.reducedMotion
      ? SKILL_EFFECT_REDUCED_MOTION_MS
      : Number(pendingSkill?.boardEffectDurationMs ?? timing.durationMs)
  };
}

export default function BoardSkillEffects({ boardSize = 13, pendingSkill = null, audioSettings = undefined, prewarm = true }) {
  const hostRef = useRef(null);
  const playedEffectIdRef = useRef("");
  const effectType = pendingSkill?.effectType ?? "";
  const targetId = pendingSkill?.targetId ?? "";
  const hasBoardEffect = skillEffectHasBoardEffect(effectType);
  const hasPendingEffect = Boolean(effectType);

  useEffect(() => {
    schedulePixiPrewarm({ enabled: prewarm && (!hasPendingEffect || hasBoardEffect) });
  }, [hasBoardEffect, hasPendingEffect, prewarm]);

  useEffect(() => {
    const host = hostRef.current;
    if (!hasBoardEffect || !host || !pendingSkill?.id || playedEffectIdRef.current === pendingSkill.id) return undefined;
    playedEffectIdRef.current = pendingSkill.id;
    let disposed = false;
    let cleanup = () => {};

    const reducedMotion = window.matchMedia?.(reducedMotionQuery)?.matches ?? false;
    const { startDelayMs, durationMs } = effectTimingForPendingSkill(pendingSkill, { reducedMotion });
    const startTimer = window.setTimeout(() => {
      if (disposed) return;
      cleanup = mountPixiEffect({ host, boardSize, pendingSkill, durationMs, reducedMotion, audioSettings });
    }, startDelayMs);

    return () => {
      disposed = true;
      window.clearTimeout(startTimer);
      cleanup();
    };
  }, [audioSettings, boardSize, hasBoardEffect, pendingSkill]);

  if (hasPendingEffect && !hasBoardEffect) return null;

  return (
    <div
      ref={hostRef}
      className="board-effects-layer"
      data-effect-id={pendingSkill?.id ?? ""}
      data-effect-type={effectType}
      data-board-effect={hasBoardEffect ? "true" : "false"}
      data-target-id={targetId}
      aria-hidden="true"
    />
  );
}

function mountPixiEffect({ host, boardSize, pendingSkill, durationMs, reducedMotion, audioSettings }) {
  let active = true;
  let app = null;
  let timeoutId = 0;
  let soundTimers = [];

  loadPixiModule().then(async (pixi) => {
    if (!active) return;
    const { Application } = pixi;
    app = new Application();
    await app.init({
      resizeTo: host,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1
    });
    if (!active) {
      app.destroy(true);
      return;
    }
    host.replaceChildren(app.canvas);
    app.canvas.className = "board-effects-canvas";
    soundTimers = scheduleBoardSkillEffectSounds({ pendingSkill, durationMs, reducedMotion, audioSettings });
    playRegisteredBoardSkillEffect({ app, pixi, host, boardSize, pendingSkill, durationMs, reducedMotion });
    timeoutId = window.setTimeout(() => {
      clearBoardSkillEffectSoundTimers(soundTimers);
      app?.destroy(true, { children: true });
      host.replaceChildren();
      app = null;
    }, durationMs + 180);
  }).catch(() => {
    host.dataset.effectFallback = "true";
  });

  return () => {
    active = false;
    window.clearTimeout(timeoutId);
    clearBoardSkillEffectSoundTimers(soundTimers);
    app?.destroy(true, { children: true });
    host.replaceChildren();
  };
}
