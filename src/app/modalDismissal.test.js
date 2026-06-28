import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  APP_MODAL_DISMISS_ORDER,
  isMobileBackCapable,
  rootBackExitGuardEnabled,
  topDismissibleModalKey
} from "./modalDismissal.js";

describe("modal dismissal", () => {
  it("keeps app modal dismiss order aligned with overlay layering", () => {
    expect(APP_MODAL_DISMISS_ORDER).toEqual([
      "result",
      "matchStart",
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
      "announcements",
      "mailbox",
      "messageBoard",
      "onboardingStory",
      "storyPlayer"
    ]);
  });

  it("selects the visually topmost dismissible modal", () => {
    expect(topDismissibleModalKey({
      resume: true,
      achievements: true
    })).toBe("achievements");
    expect(topDismissibleModalKey({
      matchStart: true,
      matchModePicker: true
    })).toBe("matchModePicker");
    expect(topDismissibleModalKey({
      matchModePicker: true,
      shop: true
    })).toBe("shop");
    expect(topDismissibleModalKey({
      result: true
    })).toBe("result");
    expect(topDismissibleModalKey({})).toBeNull();
  });

  it("wires app and home modal surfaces into shared keyboard and history dismissal", () => {
    const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
    const homeSource = readFileSync(new URL("../home/HomeScreen.jsx", import.meta.url), "utf8");

    expect(appSource).toContain("useModalDismissal({ activeId: topModalKey, onDismiss: dismissTopModal })");
    expect(appSource).toContain("const topModalKey = topDismissibleModalKey({");
    expect(appSource).toContain("...overlayState");
    expect(appSource).toContain("dismissOverlayByKey(topModalKey, overlaySetters)");
    expect(homeSource).toContain("matchModePickerOpen = false");
    expect(homeSource).toContain("onMatchModePickerOpenChange?.(true)");
  });

  it("enables mobile root-back exit confirmation only when no modal is active", () => {
    expect(rootBackExitGuardEnabled({ activeId: null, view: "login" })).toBe(true);
    expect(rootBackExitGuardEnabled({ activeId: null, view: "preloading" })).toBe(true);
    expect(rootBackExitGuardEnabled({ activeId: null, view: "home" })).toBe(true);
    expect(rootBackExitGuardEnabled({ activeId: null, view: "room" })).toBe(true);
    expect(rootBackExitGuardEnabled({ activeId: "shop", view: "home" })).toBe(false);
    expect(rootBackExitGuardEnabled({ activeId: null, view: "unknown" })).toBe(false);
  });

  it("uses mobile and narrow viewport signals for root back guarding", () => {
    expect(isMobileBackCapable({ matchMedia: () => ({ matches: true }) })).toBe(true);
    expect(isMobileBackCapable({ matchMedia: () => ({ matches: false }) })).toBe(false);
    expect(isMobileBackCapable({})).toBe(false);
  });

  it("wires the mobile root-back confirmation modal in the app shell", () => {
    const appSource = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

    expect(appSource).toContain("const [showExitConfirm, setShowExitConfirm] = useState(false)");
    expect(appSource).toContain("useRootBackExitGuard({");
    expect(appSource).toContain("enabled: rootBackExitGuardEnabled({ activeId: topModalKey, view })");
    expect(appSource).toContain("const EXIT_CONFIRM_TITLE = \"\\u786e\\u5b9a\\u8981\\u9000\\u51fa\\u6e38\\u620f\\u5417\\uff1f\"");
    expect(appSource).toContain("const EXIT_CONFIRM_TEXT = \"\\u9000\\u51fa\\u6e38\\u620f\"");
    expect(appSource).toContain("title={EXIT_CONFIRM_TITLE}");
    expect(appSource).toContain("confirmText={EXIT_CONFIRM_TEXT}");
  });

  it("prevents modal back dismissal from also triggering root exit confirmation", () => {
    const dismissalSource = readFileSync(new URL("./modalDismissal.js", import.meta.url), "utf8");

    expect(dismissalSource).toContain("modalBackDismissedInCurrentPop = true");
    expect(dismissalSource).toContain("modalHistoryCleanupInCurrentPop = true");
    expect(dismissalSource).toContain("if (modalBackDismissedInCurrentPop || modalHistoryCleanupInCurrentPop)");
    expect(dismissalSource).toContain("modalBackDismissedInCurrentPop = false");
    expect(dismissalSource).toContain("modalHistoryCleanupInCurrentPop = false");
    expect(dismissalSource).toContain("window.history.pushState(rootBackHistoryState(), \"\", window.location.href);");
    expect(dismissalSource).toContain("window.history.go(-2)");
    expect(dismissalSource).toContain("window.location.replace(\"about:blank\")");
  });
});
