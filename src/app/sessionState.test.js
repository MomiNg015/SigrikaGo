import { describe, expect, it } from "vitest";
import { initialSessionState, shouldFinishPreloadAsHome } from "./sessionState.js";

describe("initial session state", () => {
  it("does not restore auth tokens from localStorage after a page reload", () => {
    const storage = {
      getItem: (key) => key === "sigrika-token" ? "old-token" : null
    };

    expect(initialSessionState(storage)).toEqual({
      token: "",
      view: "login"
    });
  });

  it("does not send preloading back home after a room was recovered", () => {
    expect(shouldFinishPreloadAsHome({ view: "preloading", room: null, matchSuccess: null })).toBe(true);
    expect(shouldFinishPreloadAsHome({ view: "room", room: { code: "12345" }, matchSuccess: null })).toBe(false);
    expect(shouldFinishPreloadAsHome({ view: "preloading", room: null, matchSuccess: { room: { code: "12345" } } })).toBe(false);
  });
});
