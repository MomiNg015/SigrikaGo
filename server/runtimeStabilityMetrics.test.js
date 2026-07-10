import { describe, expect, test } from "vitest";
import { createRuntimeStabilityMetrics } from "./runtimeStabilityMetrics.js";

describe("runtime stability metrics", () => {
  test("starts counters at zero and increments known counters only", () => {
    const metrics = createRuntimeStabilityMetrics({
      now: () => new Date("2026-06-26T00:00:00.000Z")
    });

    metrics.increment("roomResumeAttempts");
    metrics.increment("roomResumeAttempts", 2);
    metrics.increment("unknownCounter");
    metrics.observe("gameActionAckLatencyMs", 10);
    metrics.observe("gameActionAckLatencyMs", 30);
    metrics.observe("unknownMeasurement", 999);

    expect(metrics.snapshot()).toMatchObject({
      startedAt: "2026-06-26T00:00:00.000Z",
      roomResumeAttempts: 3,
      roomResumeInitialConnectRequests: 0,
      roomPersistenceErrors: 0,
      matchPreloadTimeouts: 0
    });
    expect(metrics.snapshot().measurements.gameActionAckLatencyMs).toEqual({
      count: 2,
      total: 40,
      max: 30,
      last: 30,
      average: 20
    });
  });

  test("can reset counters without changing the start timestamp", () => {
    const metrics = createRuntimeStabilityMetrics({
      now: () => new Date("2026-06-26T00:00:00.000Z")
    });

    metrics.increment("roomRestoreErrors");
    metrics.observe("gameActionAckLatencyMs", 25);
    metrics.reset();

    expect(metrics.snapshot()).toMatchObject({
      startedAt: "2026-06-26T00:00:00.000Z",
      roomRestoreErrors: 0
    });
    expect(metrics.snapshot().measurements.gameActionAckLatencyMs.count).toBe(0);
  });
});
