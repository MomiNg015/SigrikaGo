const COUNTER_KEYS = Object.freeze([
  "roomPersistenceErrors",
  "roomRestoreErrors",
  "roomResultSaveErrors",
  "matchPreloadTimeouts",
  "roomResumeAttempts",
  "roomResumeSuccesses",
  "roomResumeMisses",
  "roomResumePatchGapRequests",
  "roomResumeSocketConnectRequests",
  "roomResumeInitialConnectRequests"
]);

export function createRuntimeStabilityMetrics({ now = () => new Date() } = {}) {
  const startedAt = now();
  const counters = Object.fromEntries(COUNTER_KEYS.map((key) => [key, 0]));

  function increment(key, amount = 1) {
    if (!Object.prototype.hasOwnProperty.call(counters, key)) return;
    counters[key] += Number.isFinite(Number(amount)) ? Number(amount) : 1;
  }

  function snapshot() {
    return {
      startedAt: startedAt.toISOString(),
      ...counters
    };
  }

  function reset() {
    for (const key of COUNTER_KEYS) counters[key] = 0;
  }

  return {
    increment,
    snapshot,
    reset
  };
}

export const runtimeStabilityMetrics = createRuntimeStabilityMetrics();
