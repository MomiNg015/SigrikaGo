import { describe, expect, it, vi } from "vitest";
import { matchSuccessCountdownCompletedTransition, startMatchTransition } from "./useMatchActions.js";

describe("match success action helpers", () => {
  it("preloads playable resources for the selected mode before joining matchmaking", () => {
    const preloadPlayableReady = vi.fn();
    const setMatchStart = vi.fn();
    const setMatchSuccess = vi.fn();
    const socket = { emit: vi.fn() };

    startMatchTransition({
      mode: "spark",
      now: () => 12345,
      preloadPlayableReady,
      setMatchStart,
      setMatchSuccess,
      socket
    });

    expect(preloadPlayableReady).toHaveBeenCalledWith({
      includePixi: true,
      mode: "spark",
      reason: "match-start"
    });
    expect(setMatchSuccess).toHaveBeenCalledWith(null);
    expect(setMatchStart).toHaveBeenCalledWith({ startedAt: 12345, mode: "spark" });
    expect(socket.emit).toHaveBeenCalledWith("match:join", { mode: "spark" });
  });

  it("uses the latest pending match room when the countdown completes", () => {
    const staleTransition = {
      startedAt: 1000,
      countdownComplete: false,
      room: { code: "12345", game: { phase: "preloading" } }
    };
    const latestTransition = {
      ...staleTransition,
      room: { code: "12345", game: { phase: "opening" } }
    };

    expect(matchSuccessCountdownCompletedTransition(staleTransition, latestTransition)).toEqual({
      ...latestTransition,
      countdownComplete: true
    });
  });
});
