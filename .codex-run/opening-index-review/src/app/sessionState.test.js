import { describe, expect, it } from "vitest";
import { initialSessionState, shouldFinishPreloadAsHome, shouldShowStartupPreload } from "./sessionState.js";

describe("initial session state", () => {
  it("does not restore auth tokens from localStorage after a page reload", () => {
    const storage = {
      getItem: (key) => key === "sigrika-token" ? "old-token" : null
    };

    expect(initialSessionState(storage)).toEqual({
      token: "",
      view: "preloading"
    });
  });

  it("does not send preloading back home after a room was recovered", () => {
    expect(shouldFinishPreloadAsHome({ view: "preloading", room: null, matchSuccess: null })).toBe(true);
    expect(shouldFinishPreloadAsHome({ view: "room", room: { code: "12345" }, matchSuccess: null })).toBe(false);
    expect(shouldFinishPreloadAsHome({ view: "preloading", room: null, matchSuccess: { room: { code: "12345" } } })).toBe(false);
  });

  it("finishes fresh login preload even if the view ref still has the previous login value", () => {
    expect(shouldFinishPreloadAsHome({ view: "login", room: null, matchSuccess: null })).toBe(true);
  });

  it("does not let startup preload cover a recovered room or pending match", () => {
    expect(shouldShowStartupPreload({ room: null, matchSuccess: null })).toBe(true);
    expect(shouldShowStartupPreload({ room: { code: "12345" }, matchSuccess: null })).toBe(false);
    expect(shouldShowStartupPreload({ room: null, matchSuccess: { room: { code: "12345" } } })).toBe(false);
  });
});
