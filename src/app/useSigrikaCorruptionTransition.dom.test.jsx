// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { isBackgroundMusicPauseRequested } from "../audio/backgroundMusicPause.js";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SIGRIKA_CORRUPTION_TRANSITION_DIRECTIONS,
  sigrikaCorruptionTransitionTimings,
  useSigrikaCorruptionTransition
} from "./useSigrikaCorruptionTransition.js";

describe("useSigrikaCorruptionTransition", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("pauses immediately, waits two seconds and commits only on the user's choice", async () => {
    const { result } = renderHook(() => useSigrikaCorruptionTransition());
    const commit = vi.fn();
    let run;

    await act(async () => {
      run = result.current.runTransition({
        direction: SIGRIKA_CORRUPTION_TRANSITION_DIRECTIONS.enter,
        request: async () => ({ user: { corrupted: true } }),
        commit
      });
      await Promise.resolve();
    });

    expect(result.current.transition.phase).toBe("negative");
    expect(isBackgroundMusicPauseRequested()).toBe(true);
    expect(commit).not.toHaveBeenCalled();

    await act(async () => {
      result.current.confirmEntry();
      await vi.advanceTimersByTimeAsync(1999);
    });
    expect(commit).not.toHaveBeenCalled();
    expect(result.current.transition.phase).toBe("negative");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(result.current.transition.phase).toBe("choice");
    expect(commit).not.toHaveBeenCalled();
    expect(isBackgroundMusicPauseRequested()).toBe(true);

    await act(async () => {
      result.current.confirmEntry();
      await run;
    });
    expect(result.current.transition).toBeNull();
    expect(commit).toHaveBeenCalledWith({ user: { corrupted: true } });
    expect(isBackgroundMusicPauseRequested()).toBe(false);
  });

  it("holds the opaque phase for a slow request and reveals the original state on failure", async () => {
    const { result } = renderHook(() => useSigrikaCorruptionTransition());
    const commit = vi.fn();
    let rejectRequest;
    const request = new Promise((resolve, reject) => {
      rejectRequest = reject;
    });
    let run;

    await act(async () => {
      run = result.current.runTransition({
        direction: SIGRIKA_CORRUPTION_TRANSITION_DIRECTIONS.exit,
        request: () => request,
        commit
      });
      await vi.advanceTimersByTimeAsync(170);
    });
    expect(result.current.transition.phase).toBe("covered");
    expect(commit).not.toHaveBeenCalled();

    await act(async () => {
      rejectRequest(new Error("恢复失败"));
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(32);
    });
    expect(result.current.transition.phase).toBe("revealing");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(210);
      await expect(run).rejects.toThrow("恢复失败");
    });
    expect(result.current.transition).toBeNull();
    expect(commit).not.toHaveBeenCalled();
  });

  it("uses a short symmetric crossfade when reduced motion is preferred", () => {
    expect(sigrikaCorruptionTransitionTimings("enter", true)).toEqual({
      commitHoldMs: 32,
      coverMs: 90,
      revealMs: 90
    });
  });

  it("shares one active run when the boundary is triggered twice", async () => {
    const { result } = renderHook(() => useSigrikaCorruptionTransition());
    const request = vi.fn().mockResolvedValue({ user: { corrupted: true } });
    const commit = vi.fn();
    let firstRun;
    let secondRun;

    await act(async () => {
      firstRun = result.current.runTransition({
        direction: SIGRIKA_CORRUPTION_TRANSITION_DIRECTIONS.enter,
        request,
        commit
      });
      secondRun = result.current.runTransition({
        direction: SIGRIKA_CORRUPTION_TRANSITION_DIRECTIONS.enter,
        request,
        commit
      });
      await Promise.resolve();
    });

    expect(secondRun).toBe(firstRun);
    expect(request).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    await act(async () => { result.current.confirmEntry(); await firstRun; });
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("keeps the choice waiting for the server and releases silence on failure or unmount", async () => {
    const { result, unmount } = renderHook(() => useSigrikaCorruptionTransition());
    const commit = vi.fn();
    let reject;
    let run;
    await act(async () => {
      run = result.current.runTransition({ direction: "enter", request: () => new Promise((_, r) => { reject = r; }), commit });
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(result.current.transition).toMatchObject({ phase: "choice", ready: false });
    act(() => result.current.confirmEntry());
    expect(commit).not.toHaveBeenCalled();
    await act(async () => { reject(new Error("请求失败")); await expect(run).rejects.toThrow("请求失败"); });
    expect(result.current.transition).toBeNull();
    expect(isBackgroundMusicPauseRequested()).toBe(false);
    await act(async () => {
      run = result.current.runTransition({ direction: "enter", request: async () => ({}), commit });
    });
    unmount();
    await run;
    expect(isBackgroundMusicPauseRequested()).toBe(false);
    expect(commit).not.toHaveBeenCalled();
  });

  it("re-arms its mounted guard after the Strict Mode effect rehearsal", async () => {
    const { result } = renderHook(() => useSigrikaCorruptionTransition(), {
      wrapper: StrictMode
    });
    const commit = vi.fn();
    let run;

    await act(async () => {
      run = result.current.runTransition({
        direction: SIGRIKA_CORRUPTION_TRANSITION_DIRECTIONS.exit,
        request: async () => ({ user: { corrupted: false } }),
        commit
      });
      await vi.advanceTimersByTimeAsync(412);
      await run;
    });

    expect(commit).toHaveBeenCalledTimes(1);
    expect(result.current.transition).toBeNull();
  });
});
