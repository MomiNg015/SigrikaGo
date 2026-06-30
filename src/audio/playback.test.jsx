import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  installBackgroundResumeTriggers,
  loadBackgroundBuffer,
  pauseBackgroundPlayback,
  playCountdownBeep,
  playDoorbellSound,
  playVoiceSound,
  primeBackgroundAudioRuntime,
  recoverBackgroundPlayback,
  resumeBackgroundContextWithFallback,
  speakText,
  stopBackgroundPlayback,
  stopVoicePlayback
} from "./playback.jsx";

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

  it("primes the background audio runtime during user activation before a track exists", async () => {
    const createdContexts = [];
    class FakeAudioContext {
      constructor() {
        this.state = "suspended";
        this.resume = vi.fn(async () => {
          this.state = "running";
        });
        createdContexts.push(this);
      }
    }
    vi.stubGlobal("window", { AudioContext: FakeAudioContext });
    const state = { context: null, retry: null };

    const context = primeBackgroundAudioRuntime(state);
    await Promise.resolve();

    expect(context).toBe(createdContexts[0]);
    expect(state.context).toBe(context);
    expect(context.resume).toHaveBeenCalledOnce();
  });

  it("uses browser gesture triggers to prime background audio before home music resolves", async () => {
    const listeners = new Map();
    const createdContexts = [];
    class FakeAudioContext {
      constructor() {
        this.state = "suspended";
        this.resume = vi.fn(async () => {
          this.state = "running";
        });
        createdContexts.push(this);
      }
    }
    const fakeWindow = {
      AudioContext: FakeAudioContext,
      addEventListener: vi.fn((event, callback) => listeners.set(event, callback)),
      removeEventListener: vi.fn((event) => listeners.delete(event))
    };
    vi.stubGlobal("window", fakeWindow);
    const state = { context: null, retry: null };

    installBackgroundResumeTriggers(state);
    listeners.get("pointerdown")();
    await Promise.resolve();

    expect(createdContexts).toHaveLength(1);
    expect(state.context).toBe(createdContexts[0]);
    expect(createdContexts[0].resume).toHaveBeenCalledOnce();
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

  it("keeps the active background track when the socket reconnect signal changes", () => {
    const source = readFileSync(new URL("./backgroundMusic.jsx", import.meta.url), "utf8");

    expect(source).toContain("state.currentTrack = track");
    expect(source).toContain("recoverBackgroundPlayback(playerRef.current)");
    expect(source).toContain("if (state.active.length > 0) return;");
    expect(source).toContain("}, [resumeSignal]);");
  });

  it("does not reschedule active background music on reconnect recovery", () => {
    const state = {
      context: { state: "running", resume: vi.fn(() => Promise.resolve()) },
      active: [{ gain: null, sources: [] }],
      currentTrack: { id: "main", playback: { mode: "single", src: "/assets/music/main.ogg", loop: true } },
      generation: 7,
      retry: null,
      bufferCache: new Map()
    };

    recoverBackgroundPlayback(state);

    expect(state.generation).toBe(7);
  });

  it("records failed background music fetches so reconnect recovery can retry", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: false,
      status: 404,
      arrayBuffer: vi.fn()
    })));
    const state = {
      bufferCache: new Map(),
      failedSources: new Map()
    };
    const context = {
      decodeAudioData: vi.fn()
    };

    await expect(loadBackgroundBuffer(state, context, "/assets/music/missing.ogg")).rejects.toThrow("Failed to load background music");

    expect(state.failedSources.get("/assets/music/missing.ogg")).toMatchObject({ status: 404 });
    expect(context.decodeAudioData).not.toHaveBeenCalled();
  });

  it("stores the background music offset while character music preview is active", () => {
    const stopped = [];
    const context = { currentTime: 31 };
    const state = {
      context,
      active: [{
        gain: { disconnect: vi.fn() },
        sources: [{ stop: () => stopped.push("source") }]
      }],
      offset: 6,
      startedAt: 21
    };

    pauseBackgroundPlayback(state);

    expect(state.offset).toBe(16);
    expect(state.active).toEqual([]);
    expect(stopped).toEqual(["source"]);
  });

  it("stops background playback state when the BackgroundMusic owner unmounts", () => {
    const stopped = [];
    const paused = [];
    const disconnected = [];
    const state = {
      active: [{
        gain: { disconnect: () => disconnected.push("gain") },
        sources: [{ stop: () => stopped.push("source") }]
      }],
      currentTrack: { id: "battle" },
      generation: 3,
      htmlFallback: {
        audio: { pause: () => paused.push("fallback") },
        src: "/assets/music/battle.ogg"
      },
      offset: 9,
      retry: null
    };

    stopBackgroundPlayback(state);

    expect(state.generation).toBe(4);
    expect(state.currentTrack).toBeNull();
    expect(state.offset).toBe(0);
    expect(state.active).toEqual([]);
    expect(state.htmlFallback).toBeNull();
    expect(stopped).toEqual(["source"]);
    expect(paused).toEqual(["fallback"]);
    expect(disconnected).toEqual(["gain"]);
  });

  it("ignores procedural browser sounds when audio browser APIs are unavailable", () => {
    expect(() => playCountdownBeep(3)).not.toThrow();
    expect(() => playDoorbellSound()).not.toThrow();
    expect(() => speakText("超时")).not.toThrow();
  });

  it("stops the previous voice fallback when a new voice starts", async () => {
    const played = [];
    class FakeAudio {
      constructor(src) {
        this.src = src;
        this.pause = vi.fn();
        this.addEventListener = vi.fn();
        played.push(this);
      }

      play() {
        return Promise.resolve();
      }
    }
    vi.stubGlobal("Audio", FakeAudio);
    vi.stubGlobal("window", { setTimeout: vi.fn((callback) => callback()) });

    playVoiceSound("/assets/voice/one.ogg");
    await Promise.resolve();
    playVoiceSound("/assets/voice/two.ogg");
    await Promise.resolve();

    expect(played).toHaveLength(2);
    expect(played[0].pause).toHaveBeenCalledOnce();
    expect(played[1].pause).not.toHaveBeenCalled();
  });

  it("stops the active voice fallback and pending speech synthesis on request", async () => {
    const played = [];
    class FakeAudio {
      constructor(src) {
        this.src = src;
        this.pause = vi.fn();
        this.addEventListener = vi.fn();
        played.push(this);
      }

      play() {
        return Promise.resolve();
      }
    }
    const speechSynthesis = { cancel: vi.fn() };
    vi.stubGlobal("Audio", FakeAudio);
    vi.stubGlobal("window", {
      setTimeout: vi.fn((callback) => callback()),
      speechSynthesis
    });

    playVoiceSound("/assets/voice/detail.ogg");
    await Promise.resolve();
    stopVoicePlayback();

    expect(played).toHaveLength(1);
    expect(played[0].pause).toHaveBeenCalledOnce();
    expect(speechSynthesis.cancel).toHaveBeenCalledOnce();
  });
});
