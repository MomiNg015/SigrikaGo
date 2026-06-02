import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { installBackgroundResumeTriggers, resumeBackgroundContextWithFallback } from "./playback.jsx";

describe("background music resume fallback", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("waits for the next user gesture when autoplay keeps the context suspended", async () => {
    const listeners = new Map();
    const context = {
      state: "suspended",
      resume: vi.fn(() => Promise.resolve())
    };
    const fakeWindow = {
      addEventListener: vi.fn((event, callback) => listeners.set(event, callback)),
      removeEventListener: vi.fn((event) => listeners.delete(event))
    };
    vi.stubGlobal("window", fakeWindow);
    const state = { context, retry: null };

    resumeBackgroundContextWithFallback(state);
    await Promise.resolve();

    expect(fakeWindow.addEventListener).toHaveBeenCalledWith("pointerdown", state.retry, { once: true });
    expect(fakeWindow.addEventListener).toHaveBeenCalledWith("keydown", state.retry, { once: true });
    expect(fakeWindow.addEventListener).toHaveBeenCalledWith("touchstart", state.retry, { once: true });

    context.state = "running";
    listeners.get("pointerdown")();

    expect(context.resume).toHaveBeenCalledTimes(2);
    expect(state.retry).toBeNull();
  });

  it("retries background music after page visibility or restore events", () => {
    const listeners = new Map();
    const context = {
      state: "suspended",
      resume: vi.fn(() => Promise.resolve())
    };
    const fakeWindow = {
      addEventListener: vi.fn((event, callback) => listeners.set(event, callback)),
      removeEventListener: vi.fn((event) => listeners.delete(event))
    };
    const fakeDocument = {
      visibilityState: "visible",
      addEventListener: vi.fn((event, callback) => listeners.set(`document:${event}`, callback)),
      removeEventListener: vi.fn((event) => listeners.delete(`document:${event}`))
    };
    vi.stubGlobal("window", fakeWindow);
    vi.stubGlobal("document", fakeDocument);
    const state = { context, retry: null };

    const cleanup = installBackgroundResumeTriggers(state);
    const pageShow = listeners.get("pageshow");
    const focus = listeners.get("focus");
    const visibilityChange = listeners.get("document:visibilitychange");
    pageShow();
    focus();
    visibilityChange();
    cleanup();

    expect(context.resume).toHaveBeenCalledTimes(3);
    expect(fakeWindow.removeEventListener).toHaveBeenCalledWith("pageshow", pageShow);
    expect(fakeDocument.removeEventListener).toHaveBeenCalledWith("visibilitychange", visibilityChange);
  });

  it("retries background music after reconnect-oriented browser signals and user gestures", () => {
    const listeners = new Map();
    const context = {
      state: "suspended",
      resume: vi.fn(() => Promise.resolve())
    };
    const fakeWindow = {
      addEventListener: vi.fn((event, callback) => listeners.set(event, callback)),
      removeEventListener: vi.fn((event) => listeners.delete(event))
    };
    vi.stubGlobal("window", fakeWindow);
    const state = { context, retry: null };

    installBackgroundResumeTriggers(state);

    listeners.get("online")();
    listeners.get("pointerdown")();
    listeners.get("touchstart")();
    listeners.get("keydown")();

    expect(context.resume).toHaveBeenCalledTimes(4);
  });

  it("reschedules the active background track when the socket reconnect signal changes", () => {
    const source = readFileSync(new URL("./playback.jsx", import.meta.url), "utf8");

    expect(source).toContain("state.currentTrack = track");
    expect(source).toContain("recoverBackgroundPlayback(playerRef.current)");
    expect(source).toContain("scheduleBackgroundTrack({ state, context, track: state.currentTrack");
    expect(source).toContain("}, [resumeSignal]);");
  });
});
