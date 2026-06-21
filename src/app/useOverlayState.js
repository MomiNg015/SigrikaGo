import { useCallback, useMemo, useState } from "react";

export const OVERLAY_STATE_KEYS = [
  "shop",
  "recruitment",
  "matchModePicker",
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
];

export function initialOverlayState(value = false) {
  return Object.fromEntries(OVERLAY_STATE_KEYS.map((key) => [key, value]));
}

export function closeOverlayState(state) {
  return {
    ...state,
    ...initialOverlayState(false)
  };
}

export function useOverlayState() {
  const [overlays, setOverlays] = useState(() => initialOverlayState(false));
  const setOverlay = useCallback((key, nextValue) => {
    setOverlays((current) => {
      const value = typeof nextValue === "function" ? nextValue(current[key]) : nextValue;
      if (current[key] === value) return current;
      return { ...current, [key]: value };
    });
  }, []);

  const setters = useMemo(() => ({
    setShowShop: (value) => setOverlay("shop", value),
    setShowRecruitment: (value) => setOverlay("recruitment", value),
    setShowMatchModePicker: (value) => setOverlay("matchModePicker", value),
    setShowHouse: (value) => setOverlay("house", value),
    setShowWarehouse: (value) => setOverlay("warehouse", value),
    setShowResume: (value) => setOverlay("resume", value),
    setShowAchievements: (value) => setOverlay("achievements", value),
    setShowPersonalization: (value) => setOverlay("personalization", value),
    setShowLeaderboard: (value) => setOverlay("leaderboard", value),
    setShowFriends: (value) => setOverlay("friends", value),
    setShowWatch: (value) => setOverlay("watch", value),
    setShowSettings: (value) => setOverlay("settings", value),
    setShowMessageBoard: (value) => setOverlay("messageBoard", value)
  }), [setOverlay]);

  return useMemo(() => ({
    showShop: overlays.shop,
    showRecruitment: overlays.recruitment,
    showMatchModePicker: overlays.matchModePicker,
    showHouse: overlays.house,
    showWarehouse: overlays.warehouse,
    showResume: overlays.resume,
    showAchievements: overlays.achievements,
    showPersonalization: overlays.personalization,
    showLeaderboard: overlays.leaderboard,
    showFriends: overlays.friends,
    showWatch: overlays.watch,
    showSettings: overlays.settings,
    showMessageBoard: overlays.messageBoard,
    ...setters
  }), [overlays, setters]);
}
