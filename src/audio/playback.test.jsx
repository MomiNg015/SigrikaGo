import { afterEach, describe, expect, it, vi } from "vitest";
import { resumeBackgroundContextWithFallback } from "./playback.jsx";

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
});
