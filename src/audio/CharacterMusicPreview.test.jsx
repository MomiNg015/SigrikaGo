import { describe, expect, it } from "vitest";
import { schedulePreviewSources } from "./CharacterMusicPreview.jsx";

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
