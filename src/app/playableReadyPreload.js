import { gameModeSkillEnabled } from "../shared/gameModes.js";
import { loadPixiModule } from "../room/pixiPrewarm.js";

const DEFAULT_PLAYABLE_READY_MODULE_LOADERS = [
  () => import("./BattleAssetPreloadScreen.jsx")
];

let corePlayableReadyPromise = null;
let pixiPlayableReadyPromise = null;

export function preloadPlayableReady({
  includePixi = false,
  loadPixi = loadPixiModule,
  mode = "spark",
  moduleLoaders = DEFAULT_PLAYABLE_READY_MODULE_LOADERS,
  now = currentTime,
  reason = "intent",
  recordMetric = recordPlayableReadyPreloadMetric
} = {}) {
  const startedAt = now();
  const shouldLoadPixi = includePixi && gameModeSkillEnabled(mode);
  const corePromise = preloadCorePlayableReadyModules(moduleLoaders);
  const pixiPromise = shouldLoadPixi
    ? preloadPixiForPlayableReady(loadPixi)
    : Promise.resolve({ ok: true, skipped: true });

  return Promise.all([corePromise, pixiPromise]).then(([core, pixi]) => {
    const completedAt = now();
    const metric = {
      completedAt,
      coreOk: core.ok,
      durationMs: Math.max(0, completedAt - startedAt),
      includePixi: shouldLoadPixi,
      mode,
      pixiOk: pixi.ok,
      reason,
      startedAt
    };
    recordMetric(metric);
    return metric;
  });
}

export function schedulePlayableReadyIdlePreload(callback, {
  timeout = 1400,
  windowLike = typeof window === "undefined" ? undefined : window
} = {}) {
  if (!windowLike) return () => {};
  if (typeof windowLike.requestIdleCallback === "function") {
    const idleId = windowLike.requestIdleCallback(callback, { timeout });
    return () => windowLike.cancelIdleCallback?.(idleId);
  }
  const timerId = windowLike.setTimeout?.(callback, Math.min(timeout, 350));
  return () => windowLike.clearTimeout?.(timerId);
}

export function recordPlayableReadyPreloadMetric(metric, {
  windowLike = typeof window === "undefined" ? undefined : window
} = {}) {
  if (!windowLike) return;
  windowLike.__SIGRIKA_PLAYABLE_READY_PRELOADS__ = [
    ...(windowLike.__SIGRIKA_PLAYABLE_READY_PRELOADS__ ?? []).slice(-9),
    metric
  ];
  try {
    windowLike.performance?.mark?.(`sigrika:playable-ready:${metric.reason}`);
  } catch {
    // Metrics must never affect the user path.
  }
  if (typeof windowLike.dispatchEvent === "function" && typeof windowLike.CustomEvent === "function") {
    windowLike.dispatchEvent(new windowLike.CustomEvent("sigrika:playable-ready-preload", { detail: metric }));
  }
}

export function resetPlayableReadyPreloadForTests() {
  corePlayableReadyPromise = null;
  pixiPlayableReadyPromise = null;
}

function preloadCorePlayableReadyModules(moduleLoaders) {
  if (!corePlayableReadyPromise) {
    corePlayableReadyPromise = Promise.allSettled(moduleLoaders.map((loadModule) => loadModule()))
      .then((results) => ({
        ok: results.every((result) => result.status === "fulfilled"),
        results
      }));
  }
  return corePlayableReadyPromise;
}

function preloadPixiForPlayableReady(loadPixi) {
  if (!pixiPlayableReadyPromise) {
    pixiPlayableReadyPromise = Promise.resolve()
      .then(loadPixi)
      .then(
        (module) => ({ ok: true, module }),
        (error) => ({ ok: false, error })
      );
  }
  return pixiPlayableReadyPromise;
}

function currentTime() {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}
