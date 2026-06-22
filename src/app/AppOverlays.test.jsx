import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AppOverlays from "./AppOverlays.jsx";

describe("AppOverlays", () => {
  it("keeps the match success countdown visible during battle asset preloading", () => {
    const markup = renderToStaticMarkup(createElement(AppOverlays, overlayProps({
      matchSuccess: {
        startedAt: Date.now(),
        countdownComplete: false,
        room: { code: "12345", game: { phase: "preloading" } }
      }
    })));

    expect(markup).toContain("match-success-modal");
  });

  it("hides the match success countdown after it completes while preloading continues", () => {
    const markup = renderToStaticMarkup(createElement(AppOverlays, overlayProps({
      matchSuccess: {
        startedAt: Date.now(),
        countdownComplete: true,
        room: { code: "12345", game: { phase: "preloading" } }
      }
    })));

    expect(markup).not.toContain("match-success-modal");
  });
});

function overlayProps(overrides = {}) {
  return {
    applyStoneDecoration: vi.fn(),
    audioSettings: {},
    characterListView: [],
    characters: {},
    incomingDuel: null,
    joinWatchRoom: vi.fn(),
    matchStart: null,
    matchSuccess: null,
    musicTracks: {},
    onMatchCancel: vi.fn(),
    onMatchSuccessComplete: vi.fn(),
    onMessageSubmitted: vi.fn(),
    onRecruitmentStatusChange: vi.fn(),
    onRemoveToast: vi.fn(),
    onResultClose: vi.fn(),
    openReplay: vi.fn(),
    replayRecords: [],
    resultModalOpen: false,
    room: null,
    selectCharacter: vi.fn(),
    selectCharacterMusic: vi.fn(),
    setAudioSettings: vi.fn(),
    setIncomingDuel: vi.fn(),
    setShowAchievements: vi.fn(),
    setShowFriends: vi.fn(),
    setShowRecruitment: vi.fn(),
    setShowHouse: vi.fn(),
    setShowLeaderboard: vi.fn(),
    setShowMessageBoard: vi.fn(),
    setShowPersonalization: vi.fn(),
    setShowResume: vi.fn(),
    setShowSettings: vi.fn(),
    setShowShop: vi.fn(),
    setShowWarehouse: vi.fn(),
    setShowWatch: vi.fn(),
    setVisualTheme: vi.fn(),
    showAchievements: false,
    showFriends: false,
    showRecruitment: false,
    showHouse: false,
    showLeaderboard: false,
    showMessageBoard: false,
    showPersonalization: false,
    showResume: false,
    showSettings: false,
    showShop: false,
    showToast: vi.fn(),
    showWarehouse: false,
    showWatch: false,
    siteSettings: {},
    socket: null,
    token: "",
    toasts: [],
    updateUser: vi.fn(),
    user: null,
    visualTheme: "",
    ...overrides
  };
}
