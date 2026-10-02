import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLobbyStatsBroadcaster } from "./lobbyStatsBroadcaster.js";

describe("lobby stats broadcaster", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("coalesces a reconnect burst into one latest-state broadcast", () => {
    const io = { emit: vi.fn() };
    const metrics = { increment: vi.fn() };
    let stats = { onlineCount: 1, matchmakingCount: 0, matchmakingCounts: { spark: 0 } };
    const broadcaster = createLobbyStatsBroadcaster({ io, getStats: () => stats, metrics });

    broadcaster.schedule();
    stats = { onlineCount: 20, matchmakingCount: 3, matchmakingCounts: { spark: 3 } };
    broadcaster.schedule();
    broadcaster.schedule();
    vi.advanceTimersByTime(100);

    expect(io.emit).toHaveBeenCalledOnce();
    expect(io.emit).toHaveBeenCalledWith("lobby:stats", stats);
    expect(metrics.increment).toHaveBeenCalledWith("lobbyStatsBroadcastRequests");
    expect(metrics.increment).toHaveBeenCalledWith("lobbyStatsBroadcastEmissions");
  });

  it("skips an unchanged payload after the first emission", () => {
    const io = { emit: vi.fn() };
    const stats = { onlineCount: 2, matchmakingCount: 1, matchmakingCounts: { standard: 1 } };
    const broadcaster = createLobbyStatsBroadcaster({ io, getStats: () => stats });

    broadcaster.schedule();
    vi.advanceTimersByTime(100);
    broadcaster.schedule();
    vi.advanceTimersByTime(100);

    expect(io.emit).toHaveBeenCalledOnce();
  });

  it("cancels a pending broadcast when the service starts draining", () => {
    const io = { emit: vi.fn() };
    const broadcaster = createLobbyStatsBroadcaster({
      io,
      getStats: () => ({ onlineCount: 1, matchmakingCount: 0, matchmakingCounts: {} })
    });

    broadcaster.schedule();
    broadcaster.close();
    vi.runAllTimers();

    expect(io.emit).not.toHaveBeenCalled();
    expect(broadcaster.schedule()).toBe(false);
  });
});
