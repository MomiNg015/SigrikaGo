import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AppOverlays from "./AppOverlays.jsx";
import OnboardingStoryModal from "../modals/OnboardingStoryModal.jsx";
import StoryPlayerModal from "../modals/StoryPlayerModal.jsx";
import TutorialSessionModal from "../tutorial/TutorialSessionModal.jsx";

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

  it("renders the generic story player above other overlays", () => {
    const markup = renderToStaticMarkup(createElement(AppOverlays, overlayProps({
      showStoryPlayer: true,
      storyPlayerScript: {
        script: {
          startNodeId: "start",
          nodes: [{ id: "start", speakerName: "达妮娅", characterId: "denia", text: "这是什么糖？", nextNodeId: "" }]
        },
        labels: { title: "道具互动" },
        clear: vi.fn(),
        open: vi.fn()
      }
    })));

    expect(markup).toContain("onboarding-story-modal");
    expect(markup).toContain("道具互动");
    expect(markup).toContain("剧情对话文本");
  });
  it("renders unified tutorial scripts through the tutorial session surface", () => {
    const onComplete = vi.fn();
    const tree = AppOverlays(overlayProps({
      showStoryPlayer: true,
      storyPlayerScript: {
        script: {
          startNodeId: "move-1",
          nodes: [{ id: "move-1", type: "player-move", pointId: "5,5", color: "black", nextNodeId: "" }]
        },
        labels: { title: "对弈教学" },
        onComplete,
        clear: vi.fn(),
        open: vi.fn()
      }
    }));

    expect(findElementByType(tree, TutorialSessionModal).props.onComplete).toBe(onComplete);
    expect(findElementByType(tree, StoryPlayerModal)).toBeNull();
  });

  it("closes every story overlay state and clears the active script when the generic story closes", () => {
    const clear = vi.fn();
    const setShowOnboardingStory = vi.fn();
    const setShowStoryPlayer = vi.fn();
    const tree = AppOverlays(overlayProps({
      showOnboardingStory: true,
      showStoryPlayer: true,
      onboardingStoryScript: storyScript(),
      storyPlayerScript: {
        script: storyScript(),
        labels: { title: "story" },
        clear,
        open: vi.fn()
      },
      setShowOnboardingStory,
      setShowStoryPlayer
    }));

    findElementByType(tree, StoryPlayerModal).props.onClose();

    expect(setShowStoryPlayer).toHaveBeenCalledWith(false);
    expect(setShowOnboardingStory).toHaveBeenCalledWith(false);
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("uses the same full story cleanup for the legacy onboarding story surface", () => {
    const clear = vi.fn();
    const setShowOnboardingStory = vi.fn();
    const setShowStoryPlayer = vi.fn();
    const tree = AppOverlays(overlayProps({
      showOnboardingStory: true,
      onboardingStoryScript: storyScript(),
      storyPlayerScript: {
        script: null,
        labels: null,
        clear,
        open: vi.fn()
      },
      setShowOnboardingStory,
      setShowStoryPlayer
    }));

    findElementByType(tree, OnboardingStoryModal).props.onClose();

    expect(setShowStoryPlayer).toHaveBeenCalledWith(false);
    expect(setShowOnboardingStory).toHaveBeenCalledWith(false);
    expect(clear).toHaveBeenCalledTimes(1);
  });
});

function storyScript() {
  return {
    startNodeId: "start",
    nodes: [{ id: "start", speakerName: "Denia", characterId: "denia", text: "Story text", nextNodeId: "" }]
  };
}

function findElementByType(node, type) {
  if (!node || typeof node !== "object") return null;
  if (node.type === type) return node;
  const children = Array.isArray(node.props?.children) ? node.props.children : [node.props?.children];
  for (const child of children) {
    const found = findElementByType(child, type);
    if (found) return found;
  }
  return null;
}

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
    onAnnouncementSummaryChange: vi.fn(),
    onMessageSubmitted: vi.fn(),
    onRecruitmentStatusChange: vi.fn(),
    onRemoveToast: vi.fn(),
    onResultClose: vi.fn(),
    openReplay: vi.fn(),
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
    setShowAnnouncements: vi.fn(),
    setShowOnboardingStory: vi.fn(),
    setShowStoryPlayer: vi.fn(),
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
    showAnnouncements: false,
    showOnboardingStory: false,
    showStoryPlayer: false,
    showMessageBoard: false,
    showPersonalization: false,
    showResume: false,
    showSettings: false,
    showShop: false,
    showToast: vi.fn(),
    announcementUnreadByKind: {},
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
