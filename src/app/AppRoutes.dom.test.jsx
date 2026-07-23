// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AppRoutes from "./AppRoutes.jsx";
import HomeScreen from "../home/HomeScreen.jsx";

vi.mock("../home/HomeScreen.jsx", () => ({
  default: vi.fn(() => <div data-testid="home-screen" />)
}));

describe("AppRoutes home render boundary", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("does not rerender the home tree for room-only route updates", () => {
    const stableCallback = vi.fn();
    const baseProps = {
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
      startPractice: stableCallback
    };
    const { rerender } = render(<AppRoutes {...baseProps} replayStep={0} />);

    expect(HomeScreen).toHaveBeenCalledTimes(1);
    rerender(<AppRoutes {...baseProps} replayStep={1} />);
    expect(HomeScreen).toHaveBeenCalledTimes(1);

    rerender(<AppRoutes {...baseProps} lobbyStats={{ onlineCount: 2, matchmakingCounts: {} }} replayStep={1} />);
    expect(HomeScreen).toHaveBeenCalledTimes(2);
  });
});
