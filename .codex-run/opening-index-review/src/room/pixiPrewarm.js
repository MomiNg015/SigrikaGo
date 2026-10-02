let pixiModulePromise = null;

export function loadPixiModule(importPixi = defaultImportPixi) {
  if (!pixiModulePromise) {
    pixiModulePromise = importPixi().catch((error) => {
      pixiModulePromise = null;
      throw error;
    });
  }
  return pixiModulePromise;
}

export function schedulePixiPrewarm({
  enabled = true,
  scheduleIdle = scheduleIdleCallback,
  importPixi = defaultImportPixi
} = {}) {
  if (!enabled || pixiModulePromise) return () => {};
  let cancelled = false;
  const cancelIdle = scheduleIdle(() => {
    if (cancelled) return;
    void loadPixiModule(importPixi).catch(() => {});
  });
  return () => {
    cancelled = true;
    cancelIdle?.();
  };
}

export function resetPixiPrewarmForTests() {
  pixiModulePromise = null;
}

export async function importPixiWithCspCompat({
  importUnsafeEval = () => import("pixi.js/unsafe-eval"),
  importPixi = () => import("pixi.js")
} = {}) {
  await importUnsafeEval();
  return importPixi();
}

function defaultImportPixi() {
  return importPixiWithCspCompat();
}

function scheduleIdleCallback(callback) {
  if (typeof window === "undefined") return () => {};
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout: 1200 });
    return () => window.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(callback, 250);
  return () => window.clearTimeout(id);
}
