import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CharacterMusicPreview, pausePreview, schedulePreviewSources } from "./CharacterMusicPreview.jsx";

describe("character music preview scheduling", () => {
  it("renders idle playback controls without the retired Rough.js sketch layer", () => {
    const html = renderToStaticMarkup(createElement(CharacterMusicPreview, {
      characterId: "sigrika",
      slots: [{
        id: "base",
        effectType: "",
        label: "普通技·星辉符文",
        track: { id: "sigrika-skill-default", name: "Sigrika Skill BGM", playback: { src: "/assets/music/sigrika.ogg", loop: true } },
        options: [{ id: "sigrika-skill-default", name: "Sigrika Skill BGM", playback: { src: "/assets/music/sigrika.ogg", loop: true } }]
      }],
      audioSettings: {}
    }));

    expect(html).toContain("character-music-player");
    expect(html).toContain("aria-busy=\"false\"");
    expect(html).not.toContain("character-music-sketch");
    expect(html).toContain("Sigrika Skill BGM");
    expect(html).toContain("aria-label=\"播放角色 BGM\"");
    expect(html).toContain("aria-pressed=\"false\"");
    expect(html).toContain("character-music-glyph is-play");
    expect(html).not.toContain("character-music-slot-mark");
    expect(html).not.toContain("lucide-play");
  });

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
