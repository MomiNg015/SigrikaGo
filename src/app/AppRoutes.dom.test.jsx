// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AppRoutes from "./AppRoutes.jsx";
import HomeScreen from "../home/HomeScreen.jsx";

vi.mock("../home/HomeScreen.jsx", () => ({
  default: vi.fn(() => <div data-testid="home-screen" />)
}));

function createBaseProps(overrides = {}) {
  const stableCallback = vi.fn();
  return {
    assetProgress: 1,
    audioSettings: { muted: false, volume: 1 },
    characters: {},
    lobbyStats: { onlineCount: 1, matchmakingCounts: {} },
    logout: stableCallback,
    mailboxBadgeCount: 0,
    recruitmentReady: false,
    showMatchModePicker: false,
    siteSettings: {
      characterLoadingLines: "",
      footerText: "",
      homeSubtitle: "",
      homeTitle: "",
      preloadTips: ""
    },
    user: { id: "user-1", role: "user", selectedCharacter: "sigrika" },
    view: "home",
    announcementUnread: false,
    onOpenOnboardingStory: stableCallback,
    onPreloadPlayableReady: stableCallback,
    selectCharacter: stableCallback,
    setShowAnnouncements: stableCallback,
    setShowFriends: stableCallback,
    setShowHouse: stableCallback,
    setShowLeaderboard: stableCallback,
    setShowMailbox: stableCallback,
    setShowMatchModePicker: stableCallback,
    setShowMessageBoard: stableCallback,
    setShowRecruitment: stableCallback,
    setShowResume: stableCallback,
    setShowSettings: stableCallback,
    setShowShop: stableCallback,
    setShowWarehouse: stableCallback,
    setShowWatch: stableCallback,
    setView: stableCallback,
    startMatch: stableCallback,
    startPractice: stableCallback,
    ...overrides
  };
}

describe("AppRoutes home render boundary", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("does not rerender the home tree for room-only route updates", () => {
    const baseProps = createBaseProps();
    const { rerender } = render(<AppRoutes {...baseProps} replayStep={0} />);

    expect(HomeScreen).toHaveBeenCalledTimes(1);
    rerender(<AppRoutes {...baseProps} replayStep={1} />);
    expect(HomeScreen).toHaveBeenCalledTimes(1);

    rerender(<AppRoutes {...baseProps} lobbyStats={{ onlineCount: 2, matchmakingCounts: {} }} replayStep={1} />);
    expect(HomeScreen).toHaveBeenCalledTimes(2);
  });

  it("forwards every home action through the memo boundary without renaming drift", () => {
    const logout = vi.fn();
    const selectCharacter = vi.fn();
    const startMatch = vi.fn();
    const startPractice = vi.fn();
    const practiceOptions = { difficulty: "intermediate", playerColor: "random" };

    render(<AppRoutes {...createBaseProps({
      logout,
      selectCharacter,
      startMatch,
      startPractice
    })} />);

    const homeProps = HomeScreen.mock.calls.at(-1)?.[0];
    expect(homeProps.onLogout).toBe(logout);
    expect(homeProps.onSelectCharacter).toBe(selectCharacter);
    expect(homeProps.onStartMatch).toBe(startMatch);
    expect(homeProps.onStartPractice).toBe(startPractice);

    homeProps.onLogout();
    homeProps.onSelectCharacter("aemeath");
    ["spark", "standard", "gomoku"].forEach((mode) => homeProps.onStartMatch(mode));
    homeProps.onStartPractice(practiceOptions);

    expect(logout).toHaveBeenCalledTimes(1);
    expect(selectCharacter).toHaveBeenCalledWith("aemeath");
    expect(startMatch.mock.calls).toEqual([["spark"], ["standard"], ["gomoku"]]);
    expect(startPractice).toHaveBeenCalledWith(practiceOptions);
  });
});
