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

    expect(metrics.snapshot()).toMatchObject({
      startedAt: "2026-06-26T00:00:00.000Z",
      roomResumeAttempts: 3,
      roomPersistenceErrors: 0,
      matchPreloadTimeouts: 0
    });
  });

  test("can reset counters without changing the start timestamp", () => {
    const metrics = createRuntimeStabilityMetrics({
      now: () => new Date("2026-06-26T00:00:00.000Z")
    });

    metrics.increment("roomRestoreErrors");
    metrics.reset();

    expect(metrics.snapshot()).toMatchObject({
      startedAt: "2026-06-26T00:00:00.000Z",
      roomRestoreErrors: 0
    });
  });
});
