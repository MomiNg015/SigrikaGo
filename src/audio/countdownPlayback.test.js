import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { voicePlaybackOptions, VOICE_PLAYBACK_PROFILES } from "./voicePlaybackProfiles.js";

const options = voicePlaybackOptions(VOICE_PLAYBACK_PROFILES.countdown);
const settings = { master: 100, voice: 100 };
const flush = async () => { for (let i = 0; i < 15; i += 1) await Promise.resolve(); };

describe("countdown playback loading and cancellation", () => {
  let api;
  let context;
  let sources;
  let now;
  const buffer = {
    sampleRate: 1000, length: 200, numberOfChannels: 1,
    getChannelData: () => Float32Array.from({ length: 200 }, (_, i) => i < 80 ? 0 : 0.1)
  };

  beforeEach(async () => {
    vi.resetModules();
    now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    sources = [];
    context = {
      state: "running", destination: {},
      decodeAudioData: vi.fn(async () => buffer),
      createGain: () => ({ gain: {}, connect: vi.fn(), disconnect: vi.fn() }),
      createBufferSource: () => {
        const source = { start: vi.fn(), stop: vi.fn(), connect: vi.fn(), disconnect: vi.fn() };
        sources.push(source);
        return source;
      }
    };
    vi.stubGlobal("window", { AudioContext: class { constructor() { return context; } } });
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) })));
    api = await import("./playback.jsx");
  });

  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("shares in-flight preload, starts at the audible onset, and reuses decoded audio", async () => {
    const preload = api.preloadVoiceSound("/10.ogg");
    api.playPreloadedVoiceSound("/10.ogg", settings, options);
    await preload;
    await flush();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(sources[0].start).toHaveBeenCalledWith(0, 0.07);
    api.playPreloadedVoiceSound("/10.ogg", settings, options);
    expect(sources).toHaveLength(2);
    expect(sources[0].stop).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not play a late decode or replace a newer digit", async () => {
    let resolveOld;
    fetch.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
    api.playPreloadedVoiceSound("/10.ogg", settings, options);
    api.playPreloadedVoiceSound("/9.ogg", settings, options);
    await flush();
    resolveOld({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) });
    await flush();
    expect(sources).toHaveLength(1);
    expect(sources[0].stop).not.toHaveBeenCalled();
  });

  it("drops a digit if loading took more than 200 ms even without a subsequent tick", async () => {
    api.playPreloadedVoiceSound("/10.ogg", settings, options);
    now = 201;
    await flush();
    expect(sources).toHaveLength(0);
  });

  it("cancels pending playback on room cleanup without cancelling a newer voice", async () => {
    const cancel = api.playPreloadedVoiceSound("/10.ogg", settings, options);
    cancel();
    await flush();
    expect(sources).toHaveLength(0);
    api.playPreloadedVoiceSound("/9.ogg", settings, options);
    await flush();
    cancel();
    expect(sources[0].stop).not.toHaveBeenCalled();
    api.stopVoicePlayback();
    expect(sources[0].stop).toHaveBeenCalledOnce();
  });

  it("checks freshness again after resuming a suspended audio context", async () => {
    await api.preloadVoiceSound("/10.ogg");
    let resume;
    context.state = "suspended";
    context.resume = () => new Promise((resolve) => { resume = resolve; });
    api.playPreloadedVoiceSound("/10.ogg", settings, options);
    now = 201;
    context.state = "running";
    resume();
    await flush();
    expect(sources).toHaveLength(0);
  });
});
