import { describe, expect, it } from "vitest";
import { BGM_FADE_SECONDS, createPlaybackKey, createPlaybackSchedule, createVolumeRamp } from "./audioScheduling.js";

describe("background audio scheduling", () => {
  it("schedules intro and loop on one audio timeline without waiting for ended events", () => {
    const schedule = createPlaybackSchedule({
      playback: {
        mode: "intro-loop",
        introSrc: "/intro.ogg",
        loopSrc: "/loop.ogg"
      },
      buffers: {
        "/intro.ogg": { duration: 7.25 },
        "/loop.ogg": { duration: 12.5 }
      },
      startAt: 10
    });

    expect(schedule).toEqual([
      { src: "/intro.ogg", startAt: 10, loop: false },
      { src: "/loop.ogg", startAt: 17.25, loop: true }
    ]);
  });

  it("schedules single loop tracks directly", () => {
    const schedule = createPlaybackSchedule({
      playback: {
        mode: "single-loop",
        src: "/battle.ogg",
        loop: true
      },
      buffers: {
        "/battle.ogg": { duration: 30 }
      },
      startAt: 4
    });

    expect(schedule).toEqual([
      { src: "/battle.ogg", startAt: 4, loop: true }
    ]);
  });

  it("builds a short linear volume ramp for track changes", () => {
    expect(createVolumeRamp({ from: 0, to: 0.48, startAt: 2 })).toEqual([
      { type: "set", value: 0, time: 2 },
      { type: "linear", value: 0.48, time: 2 + BGM_FADE_SECONDS }
    ]);
  });

  it("keeps playback identity independent from volume changes", () => {
    const playback = {
      mode: "intro-loop",
      introSrc: "/intro.ogg",
      loopSrc: "/loop.ogg",
      loop: true
    };

    expect(createPlaybackKey({ id: "home", playback }, 0)).toBe(createPlaybackKey({ id: "home", playback }, 0.72));
  });
});
