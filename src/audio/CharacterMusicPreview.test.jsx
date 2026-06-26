import { describe, expect, it, vi } from "vitest";
import {
  createPreviewState,
  loadPreviewBuffer,
  pausePreview,
  preloadPreview,
  schedulePreviewSources
} from "./CharacterMusicPreview.jsx";

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

  it("reuses in-flight preview buffer loads for the same source", async () => {
    const state = createPreviewState();
    const context = fakeContext();
    const decodeAudioData = vi.fn(async () => ({ duration: 3 }));
    context.decodeAudioData = decodeAudioData;
    const arrayBuffer = new ArrayBuffer(8);
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      arrayBuffer: async () => arrayBuffer
    });

    const [first, second] = await Promise.all([
      loadPreviewBuffer(state, context, "/assets/music/club.ogg"),
      loadPreviewBuffer(state, context, "/assets/music/club.ogg")
    ]);

    expect(first).toBe(second);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(decodeAudioData).toHaveBeenCalledTimes(1);
    expect(state.bufferCache.get("/assets/music/club.ogg")).toBe(first);
    expect(state.bufferPromises.has("/assets/music/club.ogg")).toBe(false);

    fetchMock.mockRestore();
  });

  it("clears failed in-flight preview buffer loads so playback can retry", async () => {
    const state = createPreviewState();
    const context = fakeContext();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));

    await expect(loadPreviewBuffer(state, context, "/assets/music/missing.ogg")).rejects.toThrow("network");

    expect(state.bufferCache.has("/assets/music/missing.ogg")).toBe(false);
    expect(state.bufferPromises.has("/assets/music/missing.ogg")).toBe(false);

    fetchMock.mockRestore();
  });

  it("reports preload failures without leaving an in-flight load behind", async () => {
    const state = createPreviewState();
    state.context = fakeContext();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));

    await expect(preloadPreview({
      state,
      track: { playback: { src: "/assets/music/missing.ogg" } }
    })).resolves.toBe(false);

    expect(state.bufferCache.has("/assets/music/missing.ogg")).toBe(false);
    expect(state.bufferPromises.has("/assets/music/missing.ogg")).toBe(false);

    fetchMock.mockRestore();
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
