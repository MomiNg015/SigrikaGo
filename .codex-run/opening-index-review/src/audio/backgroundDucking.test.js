import { afterEach, describe, expect, it } from "vitest";
import {
  currentDuckedBackgroundVolume,
  requestBackgroundMusicDuck,
  subscribeBackgroundDuck
} from "./backgroundDucking.js";

describe("background ducking", () => {
  const releases = [];

  afterEach(() => {
    while (releases.length) releases.pop()?.();
  });

  it("applies the cinematic ratio with authored attack and release durations", () => {
    const transitions = [];
    const unsubscribe = subscribeBackgroundDuck((transition) => transitions.push(transition));
    const release = requestBackgroundMusicDuck({ ratio: 0.15, attackMs: 350, releaseMs: 500 });
    releases.push(release);

    expect(currentDuckedBackgroundVolume(0.8)).toBeCloseTo(0.12);
    expect(transitions).toEqual([{ durationMs: 350 }]);

    release();
    expect(currentDuckedBackgroundVolume(0.8)).toBeCloseTo(0.8);
    expect(transitions).toEqual([{ durationMs: 350 }, { durationMs: 500 }]);
    unsubscribe();
  });
});
