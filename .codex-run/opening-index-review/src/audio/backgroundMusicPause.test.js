import { describe, expect, it } from "vitest";
import { requestBackgroundMusicPause, subscribeBackgroundMusicPause } from "./backgroundMusicPause.js";

describe("background music pause requests", () => {
  it("keeps background music paused until all preview requests release", () => {
    const states = [];
    const unsubscribe = subscribeBackgroundMusicPause((paused) => states.push(paused));

    const releaseA = requestBackgroundMusicPause();
    const releaseB = requestBackgroundMusicPause();
    releaseA();
    releaseB();
    unsubscribe();

    expect(states).toEqual([false, true, true, true, false]);
  });

  it("ignores duplicate release calls", () => {
    const states = [];
    const unsubscribe = subscribeBackgroundMusicPause((paused) => states.push(paused));

    const release = requestBackgroundMusicPause();
    release();
    release();
    unsubscribe();

    expect(states).toEqual([false, true, false]);
  });
});
