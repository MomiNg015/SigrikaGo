import { useEffect, useRef, useState } from "react";
import {
  skillEffectPresentation,
  skillEffectTimeline,
  SKILL_EFFECT_REDUCED_MOTION_MS
} from "../shared/skillPresentation.js";
import {
  boardSkillEffectAssetUrls,
  loadPixiAssetList,
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
  const activeEffectCleanupRef = useRef(() => {});
  const [activeBoardEffect, setActiveBoardEffect] = useState(null);
  const displaySkill = pendingSkill ?? activeBoardEffect;
  const effectType = displaySkill?.effectType ?? "";
  const targetId = displaySkill?.targetId ?? "";
  const presentation = skillEffectPresentation(effectType, { pendingSkill: displaySkill, effectsEnabled });
  const hasBoardEffect = presentation.layers.boardEffect;
  const hasPendingEffect = Boolean(effectType);
  const pendingEffectType = pendingSkill?.effectType ?? "";
  const pendingPresentation = skillEffectPresentation(pendingEffectType, { pendingSkill, effectsEnabled });
  const pendingHasBoardEffect = pendingPresentation.layers.boardEffect;

  useEffect(() => {
    return schedulePixiPrewarm({ enabled: effectsEnabled !== false && prewarm && (!pendingSkill || pendingHasBoardEffect) });
  }, [effectsEnabled, pendingHasBoardEffect, pendingSkill, prewarm]);

  useEffect(() => {
    const host = hostRef.current;
    if (effectsEnabled === false) {
      activeEffectCleanupRef.current();
      activeEffectCleanupRef.current = () => {};
      return undefined;
    }
    if (!pendingHasBoardEffect || !host || !pendingSkill?.id || playedEffectIdRef.current === pendingSkill.id) return undefined;
    activeEffectCleanupRef.current();
    activeEffectCleanupRef.current = () => {};
    playedEffectIdRef.current = pendingSkill.id;
    const activeSkill = pendingSkill;
    setActiveBoardEffect(activeSkill);
    let disposed = false;
    let cleanup = () => {};
    let started = false;
    const clearActiveBoardEffect = () => {
      setActiveBoardEffect((current) => current?.id === activeSkill.id ? null : current);
    };

    const reducedMotion = window.matchMedia?.(reducedMotionQuery)?.matches ?? false;
    const activePresentation = skillEffectPresentation(pendingEffectType, { pendingSkill: activeSkill, reducedMotion, effectsEnabled });
    const { startDelayMs, durationMs } = activePresentation.timeline;
    const preparedEffect = preparePixiEffect({ host, pendingSkill: activeSkill });
    const startTimer = window.setTimeout(() => {
      if (disposed) return;
      started = true;
      cleanup = playPreparedPixiEffect({
        preparedEffect,
        boardSize,
        pendingSkill: activeSkill,
        presentation: activePresentation,
        durationMs,
        reducedMotion,
        audioSettings,
        onComplete: clearActiveBoardEffect
      });
      activeEffectCleanupRef.current = cleanup;
    }, startDelayMs);

    return () => {
      disposed = true;
      window.clearTimeout(startTimer);
      if (!started) {
        preparedEffect.cleanup();
        clearActiveBoardEffect();
      }
    };
  }, [audioSettings, boardSize, effectsEnabled, pendingEffectType, pendingHasBoardEffect, pendingSkill]);

  useEffect(() => () => {
    activeEffectCleanupRef.current();
    activeEffectCleanupRef.current = () => {};
  }, []);

  if (effectsEnabled === false || (hasPendingEffect && !hasBoardEffect)) return null;

  return (
    <div
      ref={hostRef}
      className="board-effects-layer"
      data-effect-id={displaySkill?.id ?? ""}
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
    await waitForBoardEffectHostSize(host);
    if (!active) return;
    const { Application } = pixi;
    app = new Application();
    const initPromise = app.init({
      resizeTo: host,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: boardEffectResolution()
    });
    const assetsReady = assetUrls.length > 0
      ? loadPixiAssetList(pixi, assetUrls).then(
        (assets) => ({ ok: true, assets }),
        (error) => ({ ok: false, error })
      )
      : Promise.resolve({ ok: true, assets: [] });
    await initPromise;
    if (!active) {
      app.destroy(true);
      return null;
    }
    host.replaceChildren(app.canvas);
    app.canvas.className = "board-effects-canvas";
    return { app, host, pixi, assetsReady };
  }).catch((error) => {
    if (active) markPixiEffectFailed(host, error);
    return null;
  });

  return {
    host,
    ready,
    cleanup() {
      active = false;
      clearPixiEffectDiagnostics(host);
      app?.destroy(true, { children: true });
      host.replaceChildren();
      app = null;
    }
  };
}

function playPreparedPixiEffect({ preparedEffect, boardSize, pendingSkill, presentation, durationMs, reducedMotion, audioSettings, onComplete = () => {} }) {
  let active = true;
  let timeoutId = 0;
  let soundTimers = [];
  let restoreTicker = () => {};
  let failed = false;
  preparedEffect.host.dataset.effectState = "preparing";

  const failEffect = (error) => {
    if (!active || failed) return;
    failed = true;
    markPixiEffectFailed(preparedEffect.host, error);
    window.clearTimeout(timeoutId);
    clearBoardSkillEffectSoundTimers(soundTimers);
    timeoutId = window.setTimeout(() => {
      preparedEffect.cleanup();
      onComplete();
    }, durationMs + 180);
  };

  preparedEffect.ready.then((prepared) => {
    if (!active || !prepared) return;
    delete preparedEffect.host.dataset.effectFailed;
    delete preparedEffect.host.dataset.effectError;
    preparedEffect.host.dataset.effectState = "running";
    const { app, host, pixi, assetsReady } = prepared;
    restoreTicker = installPixiTickerErrorGuard(app, failEffect);
    void assetsReady?.then((result) => {
      if (active && result && result.ok === false) failEffect(result.error);
    });
    soundTimers = presentation.layers.sound
      ? scheduleBoardSkillEffectSounds({ pendingSkill, durationMs, reducedMotion, audioSettings })
      : [];
    playRegisteredBoardSkillEffect({
      app,
      pixi,
      host,
      boardSize,
      pendingSkill,
      durationMs,
      reducedMotion,
      onError: failEffect
    });
    timeoutId = window.setTimeout(() => {
      clearBoardSkillEffectSoundTimers(soundTimers);
      preparedEffect.cleanup();
      onComplete();
    }, durationMs + 180);
  });

  return () => {
    active = false;
    window.clearTimeout(timeoutId);
    clearBoardSkillEffectSoundTimers(soundTimers);
    restoreTicker();
    clearPixiEffectDiagnostics(preparedEffect.host);
    preparedEffect.cleanup();
    onComplete();
  };
}

export function installPixiTickerErrorGuard(app, onError = () => {}) {
  const ticker = app?.ticker;
  if (!ticker?.add || ticker.add.__sigrikaGuarded) return () => {};
  const originalAdd = ticker.add;
  const callOriginalAdd = originalAdd.bind(ticker);
  const guardedAdd = (callback, ...args) => {
    if (typeof callback !== "function") return callOriginalAdd(callback, ...args);
    const guardedCallback = (...callbackArgs) => {
      try {
        return callback(...callbackArgs);
      } catch (error) {
        onError(error);
        return undefined;
      }
    };
    return callOriginalAdd(guardedCallback, ...args);
  };
  guardedAdd.__sigrikaGuarded = true;
  ticker.add = guardedAdd;
  return () => {
    if (ticker.add === guardedAdd) ticker.add = originalAdd;
  };
}

function boardEffectResolution() {
  if (typeof window === "undefined") return 1;
  const resolution = Number(window.devicePixelRatio) || 1;
  return Math.max(1, Math.min(2, resolution));
}

async function waitForBoardEffectHostSize(host, { frames = 6 } = {}) {
  if (hasDrawableHostSize(host)) return;
  for (let index = 0; index < frames; index += 1) {
    await nextAnimationFrame();
    if (hasDrawableHostSize(host)) return;
  }
  throw new Error("Pixi board effect host has no drawable size");
}

function hasDrawableHostSize(host) {
  return Number.isFinite(Number(host?.clientWidth))
    && Number(host?.clientWidth) > 0
    && Number.isFinite(Number(host?.clientHeight))
    && Number(host?.clientHeight) > 0;
}

function nextAnimationFrame() {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => resolve());
      return;
    }
    setTimeout(resolve, 16);
  });
}

function markPixiEffectFailed(host, error) {
  if (!host?.dataset) return;
  host.dataset.effectState = "failed";
  host.dataset.effectFailed = "true";
  const message = error instanceof Error ? error.message : String(error ?? "unknown");
  host.dataset.effectError = message.slice(0, 160);
}

function clearPixiEffectDiagnostics(host) {
  if (!host?.dataset) return;
  delete host.dataset.effectState;
  delete host.dataset.effectFailed;
  delete host.dataset.effectError;
}
