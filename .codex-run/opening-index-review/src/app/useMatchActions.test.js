import { describe, expect, it, vi } from "vitest";
import {
  matchSuccessCountdownCompletedTransition,
  startMatchTransition,
  startPracticeTransition,
  startSigrikaDuelTransition
} from "./useMatchActions.js";

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

  it("starts practice through its acknowledged socket contract", () => {
    const setMatchStart = vi.fn();
    const setMatchSuccess = vi.fn();
    const socket = { emit: vi.fn() };
    startPracticeTransition({
      options: { difficulty: "beginner", playerColor: "random" },
      now: () => 55,
      preloadPlayableReady: vi.fn(),
      setMatchStart,
      setMatchSuccess,
      socket
    });

    expect(setMatchStart).toHaveBeenCalledWith({ startedAt: 55, mode: "spark", practice: true });
    expect(socket.emit).toHaveBeenCalledWith(
      "practice:start",
      { difficulty: "beginner", playerColor: "random" },
      expect.any(Function)
    );
  });

  it("applies a stale special-duel rollback before asking the player to retry", () => {
    const resetArc = {
      useCount: 8,
      phase: "awaiting-duel",
      outcome: "",
      roomCode: "",
      corrupted: true,
      active: true
    };
    const setMatchStart = vi.fn();
    const showToast = vi.fn();
    const updateUser = vi.fn();
    const socket = {
      emit: vi.fn((_event, _payload, acknowledge) => acknowledge({
        ok: false,
        error: "上次特殊对局已失效，状态已恢复，请再次点击开始决战",
        code: "special_room_reset",
        sigrikaCandyArc: resetArc
      }))
    };

    startSigrikaDuelTransition({
      preloadPlayableReady: vi.fn(),
      setMatchStart,
      setMatchSuccess: vi.fn(),
      showToast,
      socket,
      updateUser
    });

    const updater = updateUser.mock.calls[0][0];
    expect(updater({ id: "user-1", sigrikaCandyArc: { phase: "duel-active" } })).toMatchObject({
      id: "user-1",
      sigrikaCandyArc: resetArc
    });
    expect(setMatchStart).toHaveBeenLastCalledWith(null);
    expect(showToast).toHaveBeenCalledWith("上次特殊对局已失效，状态已恢复，请再次点击开始决战", "error");
  });

  it("returns the occupied state and exact race toast without joining as a spectator", () => {
    const setMatchStart = vi.fn();
    const onStatusChange = vi.fn();
    const showToast = vi.fn();
    const socket = {
      emit: vi.fn((_event, _payload, acknowledge) => acknowledge({
        ok: false,
        error: "西格莉卡？已经开始和别人对局了。",
        code: "special_duel_occupied",
        status: "occupied"
      }))
    };

    startSigrikaDuelTransition({
      preloadPlayableReady: vi.fn(),
      setMatchStart,
      setMatchSuccess: vi.fn(),
      showToast,
      onStatusChange,
      socket
    });

    expect(onStatusChange).toHaveBeenCalledWith("occupied");
    expect(setMatchStart).toHaveBeenLastCalledWith(null);
    expect(showToast).toHaveBeenCalledWith("西格莉卡？已经开始和别人对局了。", "error");
    expect(socket.emit).toHaveBeenCalledTimes(1);
  });
});
