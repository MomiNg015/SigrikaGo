import { describe, expect, it, vi } from "vitest";
import {
  APP_MODAL_DISMISS_ORDER,
  APP_OVERLAYS,
  closeOverlaySetters,
  dismissOverlayByKey,
  overlayStateFromProps,
  OVERLAY_STATE_KEYS
} from "./overlayRegistry.js";

describe("overlay registry", () => {
  it("defines one canonical app overlay contract", () => {
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
    expect(APP_MODAL_DISMISS_ORDER).toEqual(["result", "matchStart", ...OVERLAY_STATE_KEYS]);
    expect(new Set(APP_OVERLAYS.map((overlay) => overlay.key)).size).toBe(APP_OVERLAYS.length);
    expect(new Set(APP_OVERLAYS.map((overlay) => overlay.setterProp)).size).toBe(APP_OVERLAYS.length);
  });

  it("derives overlay state from component props", () => {
    expect(overlayStateFromProps({
      showShop: true,
      showMailbox: true,
      showMessageBoard: false
    })).toMatchObject({
      shop: true,
      mailbox: true,
      messageBoard: false,
      house: false
    });
  });

  it("closes every registered overlay setter", () => {
    const overlaySetters = Object.fromEntries(APP_OVERLAYS.map(({ setterProp }) => [setterProp, vi.fn()]));

    closeOverlaySetters(overlaySetters);

    for (const setter of Object.values(overlaySetters)) {
      expect(setter).toHaveBeenCalledWith(false);
    }
  });

  it("dismisses a registered overlay by key", () => {
    const setShowMailbox = vi.fn();

    expect(dismissOverlayByKey("mailbox", { setShowMailbox })).toBe(true);
    expect(setShowMailbox).toHaveBeenCalledWith(false);
    expect(dismissOverlayByKey("unknown", { setShowMailbox })).toBe(false);
  });
});
