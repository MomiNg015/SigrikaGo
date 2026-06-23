import { describe, expect, it } from "vitest";
import { closeOverlayState, initialOverlayState, OVERLAY_STATE_KEYS } from "./useOverlayState.js";

describe("overlay state", () => {
  it("keeps every app overlay key in one state contract", () => {
    expect(OVERLAY_STATE_KEYS).toEqual([
      "matchModePicker",
      "house",
      "resume",
      "achievements",
      "personalization",
      "warehouse",
      "leaderboard",
      "watch",
      "friends",
      "shop",
      "recruitment",
      "settings",
      "mailbox",
      "messageBoard"
    ]);
    expect(initialOverlayState()).toEqual({
      matchModePicker: false,
      house: false,
      resume: false,
      achievements: false,
      personalization: false,
      warehouse: false,
      leaderboard: false,
      watch: false,
      friends: false,
      shop: false,
      recruitment: false,
      settings: false,
      mailbox: false,
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
