// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRoomCountdownClock } from "./useRoomCountdownClock.js";

function room(seconds, overrides = {}) {
  return {
    code: "room", game: { phase: "playing", turn: "black", history: [] },
    players: [{ color: "black", connected: true, time: { main: 0, periods: 3, periodRemaining: seconds } }],
    ...overrides
  };
}

describe("shared visual and audible countdown clock", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] }));
  afterEach(() => vi.useRealTimers());

  it("keeps one-second beats across early and late network snapshots", () => {
    const { result, rerender, unmount } = renderHook(({ value }) => useRoomCountdownClock(value, true), { initialProps: { value: room(10) } });
    const seconds = () => result.current.players[0].time.periodRemaining;
    act(() => vi.advanceTimersByTime(800));
    rerender({ value: room(9) });
    expect(seconds()).toBe(10);
    act(() => vi.advanceTimersByTime(200));
    expect(seconds()).toBe(9);
    act(() => vi.advanceTimersByTime(1000));
    expect(seconds()).toBe(8);
    act(() => vi.advanceTimersByTime(180));
    rerender({ value: room(8) });
    expect(seconds()).toBe(8);
    act(() => vi.advanceTimersByTime(820));
    expect(seconds()).toBe(7);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("never predicts more than one missing tick or fabricates a timeout", () => {
    const { result, rerender } = renderHook(({ value }) => useRoomCountdownClock(value, true), { initialProps: { value: room(10) } });
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.players[0].time.periodRemaining).toBe(9);
    rerender({ value: room(2) });
    expect(result.current.players[0].time.periodRemaining).toBe(2);
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.players[0].time.periodRemaining).toBe(1);
    expect(result.current.game.phase).toBe("playing");
  });

  it("rebases on reset, history changes, phase changes, replay and disconnection", () => {
    const { result, rerender, unmount } = renderHook(({ value, enabled }) => useRoomCountdownClock(value, enabled), { initialProps: { value: room(5), enabled: true } });
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.players[0].time.periodRemaining).toBe(4);
    for (const value of [room(10), room(5, { game: { phase: "playing", turn: "black", history: [{}] } }), room(5, { game: { phase: "finished", turn: "black", history: [] } })]) {
      rerender({ value, enabled: true });
      expect(result.current).toBe(value);
    }
    const replay = room(5);
    rerender({ value: replay, enabled: false });
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current).toBe(replay);
    const disconnected = room(5);
    disconnected.players[0].connected = false;
    rerender({ value: disconnected, enabled: true });
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current).toBe(disconnected);
    unmount();
  });
});
