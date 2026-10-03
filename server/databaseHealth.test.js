import { afterEach, describe, expect, test, vi } from "vitest";
import { createDatabaseHealth } from "./databaseHealth.js";
import { createRuntimeServiceState } from "./runtimeServiceState.js";
import { notePersistenceFailure, notePersistenceSuccess, persistenceHealthStats } from "./persistenceHealth.js";

afterEach(() => vi.useRealTimers());
describe("storage readiness", () => {
  test("bounds a hung probe and never accumulates more queries while it is pending", async () => {
    vi.useFakeTimers();
    const probe = vi.fn(() => new Promise(() => {}));
    const health = createDatabaseHealth({ probe });
    const starting = health.start();
    await vi.advanceTimersByTimeAsync(2000);
    await starting;
    expect(health.snapshot().ok).toBe(false);
    await vi.advanceTimersByTimeAsync(30000);
    expect(probe).toHaveBeenCalledOnce();
    health.close();
  });
  test("caches success, detects errors, recovers and rejects stale health", async () => {
    let clock = 0;
    const probe = vi.fn().mockResolvedValue(1);
    const health = createDatabaseHealth({ probe, now: () => clock });
    await health.start();
    expect(health.snapshot().ok).toBe(true);
    health.snapshot(); health.snapshot();
    expect(probe).toHaveBeenCalledOnce();
    probe.mockRejectedValueOnce(new Error("locked"));
    await health.check();
    expect(health.snapshot().ok).toBe(false);
    await health.check();
    expect(health.snapshot().ok).toBe(true);
    clock = 15000;
    expect(health.snapshot().ok).toBe(false);
    health.close();
  });
  test("persistent result failures block readiness and admission until successful retry", () => {
    notePersistenceFailure("test-result", 0);
    notePersistenceFailure("test-result", 15000);
    notePersistenceFailure("test-result", 30000);
    const runtime = createRuntimeServiceState({ persistenceStats: () => persistenceHealthStats(30000), performanceMetrics: { snapshot: () => ({}) } });
    expect(runtime.readiness()).toMatchObject({ ok: false, status: "persistence-unavailable" });
    expect(runtime.admission("match").code).toBe("storage_unavailable");
    notePersistenceSuccess("test-result");
    expect(runtime.readiness().ok).toBe(true);
    runtime.close();
  });
});
