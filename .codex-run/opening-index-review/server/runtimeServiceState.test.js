import { describe, expect, it, vi } from "vitest";
import {
  createRuntimePerformanceMetrics,
  createRuntimeServiceState,
  roomSpectatorAdmission,
  runtimeCapacityLimits
} from "./runtimeServiceState.js";

describe("runtime service state", () => {
  it("uses safe deployment capacity defaults and accepts positive overrides", () => {
    expect(runtimeCapacityLimits({})).toEqual({
      maxOnlineUsers: 500,
      maxActiveRooms: 100,
      maxSpectatorsPerRoom: 20
    });
    expect(runtimeCapacityLimits({
      MAX_ONLINE_USERS: "750",
      MAX_ACTIVE_ROOMS: "125",
      MAX_SPECTATORS_PER_ROOM: "30"
    })).toEqual({
      maxOnlineUsers: 750,
      maxActiveRooms: 125,
      maxSpectatorsPerRoom: 30
    });
    expect(runtimeCapacityLimits({ MAX_ONLINE_USERS: "0", MAX_ACTIVE_ROOMS: "bad" })).toEqual({
      maxOnlineUsers: 500,
      maxActiveRooms: 100,
      maxSpectatorsPerRoom: 20
    });
  });

  it("limits first-time spectators per room but permits an existing spectator reconnect", () => {
    const room = {
      spectators: [
        { user: { id: "watcher-a" } },
        { user: { id: "watcher-b" } }
      ]
    };

    expect(roomSpectatorAdmission(room, "watcher-c", { maxSpectatorsPerRoom: 2 })).toEqual({
      ok: false,
      code: "room_spectator_capacity",
      error: "当前房间观战席已满，请稍后再试"
    });
    expect(roomSpectatorAdmission(room, "watcher-a", { maxSpectatorsPerRoom: 2 })).toEqual({
      ok: true,
      existing: true
    });

    const state = createRuntimeServiceState({
      env: { MAX_ONLINE_USERS: "1", MAX_ACTIVE_ROOMS: "1", MAX_SPECTATORS_PER_ROOM: "2" },
      onlineCount: () => 10,
      activeRoomCount: () => 10,
      performanceMetrics: stubPerformanceMetrics()
    });
    expect(state.admission("spectator", { room, userId: "watcher-a" })).toEqual({ ok: true });
  });

  it("protects existing rooms by rejecting new admissions at soft limits", () => {
    const state = createRuntimeServiceState({
      env: { MAX_ONLINE_USERS: "3", MAX_ACTIVE_ROOMS: "2" },
      onlineCount: () => 3,
      activeRoomCount: () => 1,
      performanceMetrics: stubPerformanceMetrics()
    });

    expect(state.admission("match")).toEqual(expect.objectContaining({ ok: false, code: "online_capacity" }));

    const roomLimited = createRuntimeServiceState({
      env: { MAX_ONLINE_USERS: "10", MAX_ACTIVE_ROOMS: "2" },
      onlineCount: () => 2,
      activeRoomCount: () => 2,
      performanceMetrics: stubPerformanceMetrics()
    });
    expect(roomLimited.admission("spectator")).toEqual(expect.objectContaining({
      ok: false,
      code: "active_room_capacity"
    }));
  });

  it("enters drain once and exposes readiness plus capacity telemetry", () => {
    const state = createRuntimeServiceState({
      now: () => Date.parse("2026-07-10T08:00:00.000Z"),
      onlineCount: () => 12,
      activeRoomCount: () => 4,
      persistenceStats: () => ({ pendingRooms: 2 }),
      performanceMetrics: stubPerformanceMetrics({ rssBytes: 123 })
    });

    expect(state.readiness()).toEqual({ ok: true, status: "ready" });
    expect(state.beginDrain("deploy")).toBe(true);
    expect(state.beginDrain("duplicate")).toBe(false);
    expect(state.admission()).toEqual(expect.objectContaining({ ok: false, code: "server_draining" }));
    expect(state.readiness()).toEqual({
      ok: false,
      status: "draining",
      reason: "deploy",
      startedAt: "2026-07-10T08:00:00.000Z"
    });
    expect(state.snapshot()).toMatchObject({
      draining: true,
      drainReason: "deploy",
      current: { onlineUsers: 12, activeRooms: 4, pendingPersistenceRooms: 2 },
      process: { rssBytes: 123 }
    });
  });
});

describe("runtime performance metrics", () => {
  it("reports process memory and event-loop measurements and can close the monitor", () => {
    const histogram = {
      enable: vi.fn(),
      disable: vi.fn(),
      percentile: vi.fn(() => 25_000_000),
      max: 80_000_000
    };
    const performanceLike = {
      eventLoopUtilization: vi.fn(() => ({ utilization: 0.25 }))
    };
    const metrics = createRuntimePerformanceMetrics({
      processLike: {
        uptime: () => 42,
        memoryUsage: () => ({ rss: 100, heapUsed: 50, heapTotal: 75, external: 5 })
      },
      performanceLike,
      histogram
    });

    expect(metrics.snapshot()).toMatchObject({
      uptimeSeconds: 42,
      rssBytes: 100,
      heapUsedBytes: 50,
      eventLoopDelayP95Ms: 25,
      eventLoopDelayMaxMs: 80,
      eventLoopUtilization: 0.25
    });
    metrics.close();
    expect(histogram.enable).toHaveBeenCalledOnce();
    expect(histogram.disable).toHaveBeenCalledOnce();
  });
});

function stubPerformanceMetrics(snapshot = {}) {
  return {
    snapshot: () => snapshot,
    close: vi.fn()
  };
}
