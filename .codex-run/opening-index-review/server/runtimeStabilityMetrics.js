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
  "roomResumeInitialConnectRequests",
  "gameActionAttempts",
  "gameActionAckSuccesses",
  "gameActionAckFailures",
  "gameActionDuplicateAcks",
  "gameActionDrainRejections",
  "admissionRejectedMatches",
  "admissionRejectedSpectators",
  "lobbyStatsBroadcastRequests",
  "lobbyStatsBroadcastEmissions"
]);

const MEASUREMENT_KEYS = Object.freeze([
  "gameActionAckLatencyMs",
  "roomViewBuildMs",
  "roomUpdateBytes"
]);

export function createRuntimeStabilityMetrics({ now = () => new Date() } = {}) {
  const startedAt = now();
  const counters = Object.fromEntries(COUNTER_KEYS.map((key) => [key, 0]));
  const measurements = Object.fromEntries(MEASUREMENT_KEYS.map((key) => [key, emptyMeasurement()]));
  let roomUpdateSequence = 0;

  function increment(key, amount = 1) {
    if (!Object.prototype.hasOwnProperty.call(counters, key)) return;
    counters[key] += Number.isFinite(Number(amount)) ? Number(amount) : 1;
  }

  function snapshot() {
    return {
      startedAt: startedAt.toISOString(),
      ...counters,
      measurements: Object.fromEntries(Object.entries(measurements).map(([key, value]) => [key, {
        ...value,
        average: value.count > 0 ? value.total / value.count : 0
      }]))
    };
  }

  function observe(key, value) {
    if (!Object.prototype.hasOwnProperty.call(measurements, key)) return;
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) return;
    const measurement = measurements[key];
    measurement.count += 1;
    measurement.total += number;
    measurement.max = Math.max(measurement.max, number);
    measurement.last = number;
  }

  function reset() {
    for (const key of COUNTER_KEYS) counters[key] = 0;
    for (const key of MEASUREMENT_KEYS) measurements[key] = emptyMeasurement();
    roomUpdateSequence = 0;
  }

  function recordRoomUpdate(payload, { sampleEvery = 50 } = {}) {
    roomUpdateSequence += 1;
    if (roomUpdateSequence % Math.max(1, Number(sampleEvery) || 50) !== 0) return;
    try {
      observe("roomUpdateBytes", Buffer.byteLength(JSON.stringify(payload), "utf8"));
    } catch {
      // Diagnostics must never interrupt room delivery.
    }
  }

  return {
    increment,
    observe,
    recordRoomUpdate,
    snapshot,
    reset
  };
}

export const runtimeStabilityMetrics = createRuntimeStabilityMetrics();

function emptyMeasurement() {
  return { count: 0, total: 0, max: 0, last: 0 };
}
