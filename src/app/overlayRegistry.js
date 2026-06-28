export const APP_OVERLAYS = Object.freeze([
  { key: "matchModePicker", showProp: "showMatchModePicker", setterProp: "setShowMatchModePicker" },
  { key: "house", showProp: "showHouse", setterProp: "setShowHouse" },
  { key: "resume", showProp: "showResume", setterProp: "setShowResume" },
  { key: "achievements", showProp: "showAchievements", setterProp: "setShowAchievements" },
  { key: "personalization", showProp: "showPersonalization", setterProp: "setShowPersonalization" },
  { key: "warehouse", showProp: "showWarehouse", setterProp: "setShowWarehouse" },
  { key: "leaderboard", showProp: "showLeaderboard", setterProp: "setShowLeaderboard" },
  { key: "watch", showProp: "showWatch", setterProp: "setShowWatch" },
  { key: "friends", showProp: "showFriends", setterProp: "setShowFriends" },
  { key: "shop", showProp: "showShop", setterProp: "setShowShop" },
  { key: "recruitment", showProp: "showRecruitment", setterProp: "setShowRecruitment" },
  { key: "settings", showProp: "showSettings", setterProp: "setShowSettings" },
  { key: "announcements", showProp: "showAnnouncements", setterProp: "setShowAnnouncements" },
  { key: "mailbox", showProp: "showMailbox", setterProp: "setShowMailbox" },
  { key: "messageBoard", showProp: "showMessageBoard", setterProp: "setShowMessageBoard" },
  { key: "onboardingStory", showProp: "showOnboardingStory", setterProp: "setShowOnboardingStory" },
  { key: "storyPlayer", showProp: "showStoryPlayer", setterProp: "setShowStoryPlayer" }
]);

export const OVERLAY_STATE_KEYS = Object.freeze(APP_OVERLAYS.map(({ key }) => key));
export const APP_MODAL_DISMISS_ORDER = Object.freeze(["result", "matchStart", ...OVERLAY_STATE_KEYS]);

const OVERLAY_BY_KEY = new Map(APP_OVERLAYS.map((overlay) => [overlay.key, overlay]));

export function overlayStateFromProps(props) {
  return Object.fromEntries(APP_OVERLAYS.map(({ key, showProp }) => [key, Boolean(props[showProp])]));
}

export function closeOverlaySetters(overlaySetters) {
  for (const { setterProp } of APP_OVERLAYS) {
    overlaySetters[setterProp]?.(false);
  }
}

export function dismissOverlayByKey(key, overlaySetters) {
  const setterProp = OVERLAY_BY_KEY.get(key)?.setterProp;
  if (!setterProp) return false;
  overlaySetters[setterProp]?.(false);
  return true;
}
