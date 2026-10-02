import { afterEach, describe, expect, test, vi } from "vitest";
import {
  clearRoomInterval,
  clearRoomTimers,
  clearRoomTimeout,
  scheduleRoomInterval,
  scheduleRoomTimeout
} from "./roomTimers.js";

describe("roomTimers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("tracks room timeouts and removes them after they fire", () => {
    vi.useFakeTimers();
    const room = {};
    const callback = vi.fn();

    const id = scheduleRoomTimeout(room, callback, 1000);

    expect(room.timeoutIds).toEqual([id]);

    vi.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(room.timeoutIds).toEqual([]);
  });

  test("clears a tracked room timeout", () => {
    vi.useFakeTimers();
    const room = {};
    const callback = vi.fn();
    const id = scheduleRoomTimeout(room, callback, 1000);

    clearRoomTimeout(room, id);
    vi.advanceTimersByTime(1000);

    expect(callback).not.toHaveBeenCalled();
    expect(room.timeoutIds).toEqual([]);
  });

  test("clears all room timers without dropping the tracked interval id", () => {
    vi.useFakeTimers();
    const room = {};
    const intervalCallback = vi.fn();
    const timeoutCallback = vi.fn();

    const intervalId = scheduleRoomInterval(room, intervalCallback, 1000);
    scheduleRoomTimeout(room, timeoutCallback, 1000);

    clearRoomTimers(room);
    vi.advanceTimersByTime(1000);

    expect(room.timerId).toBe(intervalId);
    expect(room.timeoutIds).toEqual([]);
    expect(intervalCallback).not.toHaveBeenCalled();
    expect(timeoutCallback).not.toHaveBeenCalled();
  });

  test("clears only the room interval", () => {
    vi.useFakeTimers();
    const room = {};
    const intervalCallback = vi.fn();

    scheduleRoomInterval(room, intervalCallback, 1000);
    clearRoomInterval(room);
    vi.advanceTimersByTime(1000);

    expect(intervalCallback).not.toHaveBeenCalled();
  });
});
