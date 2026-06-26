import { afterEach, describe, expect, it, vi } from "vitest";
import { createPreviewState, loadPreviewBuffers, pausePreview, schedulePreviewSources } from "./CharacterMusicPreview.jsx";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("character music preview scheduling", () => {
  it("resumes intro-loop playback from the intro offset", () => {
    const context = fakeContext();
    const sources = schedulePreviewSources({
      context,
      playback: { mode: "intro-loop", introSrc: "intro.ogg", loopSrc: "loop.ogg" },
      buffers: {
        "intro.ogg": { duration: 5 },
        "loop.ogg": { duration: 8 }
      },
      startAt: 10,
      offset: 2,
      destination: {}
    });

    expect(sources.map((source) => source.started)).toEqual([
      { startAt: 10, offset: 2 },
      { startAt: 13, offset: 0 }
    ]);
  });

  it("resumes intro-loop playback inside the loop section", () => {
    const context = fakeContext();
    const sources = schedulePreviewSources({
      context,
      playback: { mode: "intro-loop", introSrc: "intro.ogg", loopSrc: "loop.ogg" },
      buffers: {
        "intro.ogg": { duration: 5 },
        "loop.ogg": { duration: 8 }
      },
      startAt: 10,
      offset: 15,
      destination: {}
    });

    expect(sources).toHaveLength(1);
    expect(sources[0].loop).toBe(true);
    expect(sources[0].started).toEqual({ startAt: 10, offset: 2 });
  });

  it("stores the elapsed preview offset when paused", () => {
    const stopped = [];
    const state = {
      active: {
        gain: { disconnect() {} },
        sources: [{ stop: () => stopped.push("source") }]
      },
      context: { currentTime: 18 },
      offset: 4,
      startedAt: 11
    };

    pausePreview(state);

    expect(state.offset).toBe(11);
    expect(state.active).toBeNull();
    expect(stopped).toEqual(["source"]);
  });

  it("reuses in-flight decoded buffers for repeated loads", async () => {
    const state = createPreviewState();
    const context = {
      decodeAudioData: vi.fn(async () => ({ duration: 12 }))
    };
    const arrayBuffer = new ArrayBuffer(4);
    vi.stubGlobal("fetch", vi.fn(async () => ({
      arrayBuffer: async () => arrayBuffer
    })));

    const playback = { src: "song.ogg", loop: true };
    const [first, second] = await Promise.all([
      loadPreviewBuffers(state, context, playback),
      loadPreviewBuffers(state, context, playback)
    ]);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(context.decodeAudioData).toHaveBeenCalledTimes(1);
    expect(first["song.ogg"]).toBe(second["song.ogg"]);
    expect(state.bufferCache.has("song.ogg")).toBe(true);
    expect(state.bufferPromises.has("song.ogg")).toBe(false);
  });
});

function fakeContext() {
  return {
    createBufferSource: () => ({
      buffer: null,
      loop: false,
      connect(destination) {
        this.destination = destination;
      },
      start(startAt, offset = 0) {
        this.started = { startAt, offset };
      }
    })
  };
}
