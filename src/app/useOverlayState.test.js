import { describe, expect, it } from "vitest";
import { closeOverlayState, initialOverlayState, OVERLAY_STATE_KEYS } from "./useOverlayState.js";

describe("overlay state", () => {
  it("keeps every app overlay key in one state contract", () => {
    expect(OVERLAY_STATE_KEYS).toEqual([
      "shop",
      "gacha",
      "house",
      "warehouse",
      "resume",
      "achievements",
      "personalization",
      "leaderboard",
      "friends",
      "watch",
      "settings",
      "messageBoard"
    ]);
    expect(initialOverlayState()).toEqual({
      shop: false,
      gacha: false,
      house: false,
      warehouse: false,
      resume: false,
      achievements: false,
      personalization: false,
      leaderboard: false,
      friends: false,
      watch: false,
      settings: false,
      messageBoard: false
    });
  });

  it("closes all known overlays without dropping unrelated state", () => {
    expect(closeOverlayState({
      ...initialOverlayState(true),
      custom: true
    })).toEqual({
      ...initialOverlayState(false),
      custom: true
    });
  });
});
