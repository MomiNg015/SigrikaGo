import { useEffect, useRef } from "react";
import {
  skillEffectPresentation,
  skillEffectTimeline,
  SKILL_EFFECT_REDUCED_MOTION_MS
} from "../shared/skillPresentation.js";
import {
  boardSkillEffectAssetUrls,
  playRegisteredBoardSkillEffect
} from "./boardSkillEffectRegistry.js";
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
  return skillEffectTimeline(pendingSkill, options);
}

export default function BoardSkillEffects({
  boardSize = 13,
  pendingSkill = null,
  audioSettings = undefined,
  prewarm = true,
  effectsEnabled = true
}) {
  const hostRef = useRef(null);
  const playedEffectIdRef = useRef("");
  const effectType = pendingSkill?.effectType ?? "";
  const targetId = pendingSkill?.targetId ?? "";
  const presentation = skillEffectPresentation(effectType, { pendingSkill, effectsEnabled });
  const hasBoardEffect = presentation.layers.boardEffect;
  const hasPendingEffect = Boolean(effectType);

  useEffect(() => {
    return schedulePixiPrewarm({ enabled: effectsEnabled !== false && prewarm && (!hasPendingEffect || hasBoardEffect) });
  }, [effectsEnabled, hasBoardEffect, hasPendingEffect, prewarm]);

  useEffect(() => {
    const host = hostRef.current;
    if (effectsEnabled === false || !hasBoardEffect || !host || !pendingSkill?.id || playedEffectIdRef.current === pendingSkill.id) return undefined;
    playedEffectIdRef.current = pendingSkill.id;
    let disposed = false;
    let cleanup = () => {};

    const reducedMotion = window.matchMedia?.(reducedMotionQuery)?.matches ?? false;
    const activePresentation = skillEffectPresentation(effectType, { pendingSkill, reducedMotion, effectsEnabled });
    const { startDelayMs, durationMs } = activePresentation.timeline;
    const preparedEffect = preparePixiEffect({ host, pendingSkill });
    const startTimer = window.setTimeout(() => {
      if (disposed) return;
      cleanup = playPreparedPixiEffect({
        preparedEffect,
        boardSize,
        pendingSkill,
        presentation: activePresentation,
        durationMs,
        reducedMotion,
        audioSettings
      });
    }, startDelayMs);

    return () => {
      disposed = true;
      window.clearTimeout(startTimer);
      cleanup();
      preparedEffect.cleanup();
    };
  }, [audioSettings, boardSize, effectsEnabled, effectType, hasBoardEffect, pendingSkill]);

  if (effectsEnabled === false || (hasPendingEffect && !hasBoardEffect)) return null;

  return (
    <div
      ref={hostRef}
      className="board-effects-layer"
      data-effect-id={pendingSkill?.id ?? ""}
      data-effect-type={effectType}
      data-board-effect={hasBoardEffect ? "true" : "false"}
      data-effects-enabled={effectsEnabled === false ? "false" : "true"}
      data-target-id={targetId}
      aria-hidden="true"
    />
  );
}

export function preparePixiEffect({ host, pendingSkill, loadPixi = loadPixiModule }) {
  let active = true;
  let app = null;
  const assetUrls = boardSkillEffectAssetUrls(pendingSkill?.effectType);

  const ready = loadPixi().then(async (pixi) => {
    if (!active) return;
    const { Application } = pixi;
    app = new Application();
    const initPromise = app.init({
      resizeTo: host,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: typeof window === "undefined" ? 1 : window.devicePixelRatio || 1
    });
    const assetsPromise = assetUrls.length > 0
      ? pixi.Assets?.load?.(assetUrls).catch(() => {})
      : Promise.resolve();
    await Promise.all([initPromise, assetsPromise]);
    if (!active) {
      app.destroy(true);
      return null;
    }
    host.replaceChildren(app.canvas);
    app.canvas.className = "board-effects-canvas";
    return { app, host, pixi };
  }).catch(() => {
    if (active) host.dataset.effectFallback = "true";
    return null;
  });

  return {
    host,
    ready,
    cleanup() {
      active = false;
      delete host.dataset.effectFallback;
      app?.destroy(true, { children: true });
      host.replaceChildren();
      app = null;
    }
  };
}

function playPreparedPixiEffect({ preparedEffect, boardSize, pendingSkill, presentation, durationMs, reducedMotion, audioSettings }) {
  let active = true;
  let timeoutId = 0;
  let soundTimers = [];
  preparedEffect.host.dataset.effectFallback = "true";

  preparedEffect.ready.then((prepared) => {
    if (!active || !prepared) return;
    delete preparedEffect.host.dataset.effectFallback;
    const { app, host, pixi } = prepared;
    soundTimers = presentation.layers.sound
      ? scheduleBoardSkillEffectSounds({ pendingSkill, durationMs, reducedMotion, audioSettings })
      : [];
    playRegisteredBoardSkillEffect({ app, pixi, host, boardSize, pendingSkill, durationMs, reducedMotion });
    timeoutId = window.setTimeout(() => {
      clearBoardSkillEffectSoundTimers(soundTimers);
      preparedEffect.cleanup();
    }, durationMs + 180);
  });

  return () => {
    active = false;
    window.clearTimeout(timeoutId);
    clearBoardSkillEffectSoundTimers(soundTimers);
    delete preparedEffect.host.dataset.effectFallback;
  };
}
