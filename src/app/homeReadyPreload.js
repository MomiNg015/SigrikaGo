// Warm player windows during login, before the home surface becomes interactive.
const moduleLoaders = [
  () => import("../modals/AchievementModal.jsx"),
  () => import("../modals/AnnouncementModal.jsx"),
  () => import("../modals/FriendsModal.jsx"),
  () => import("../modals/HouseModal.jsx"),
  () => import("../modals/LeaderboardModal.jsx"),
  () => import("../modals/MailboxModal.jsx"),
  () => import("../modals/MessageBoardModal.jsx"),
  () => import("../modals/PersonalizationModal.jsx"),
  () => import("../modals/RecruitmentModal.jsx"),
  () => import("../modals/ResumeModal.jsx"),
  () => import("../modals/SettingsModal.jsx"),
  () => import("../modals/ShopModal.jsx"),
  () => import("../modals/WarehouseModal.jsx"),
  () => import("../modals/WatchModal.jsx"),
  () => import("./BattleAssetPreloadScreen.jsx")
];

export async function preloadHomeReady({
  loaders = moduleLoaders,
  loadFont = (font) => globalThis.document?.fonts?.load(font, "IRIS0123456789明亮校园围棋部")
} = {}) {
  await Promise.all([
    ...loaders.map((load) => load()),
    ...['400 16px "Sigrika Window Title"', '400 16px "Sigrika Accent Latin"', '400 16px "IRIS Dotted Songti Circle"'].map((font) => loadFont(font))
  ]);
}
