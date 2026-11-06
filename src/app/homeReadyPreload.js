// Low-frequency windows warm after the home surface is ready.
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
  loaders = [],
  timeoutMs = 8000,
  loadFont = (font) => globalThis.document?.fonts?.load(font, "IRIS0123456789明亮校园围棋部")
} = {}) {
  await Promise.all([
    ...loaders.map((load) => load()),
    ...['400 16px "Sigrika Window Title"', '400 16px "Sigrika Accent Latin"'].map((font) => loadRequiredFont(font, loadFont, timeoutMs))
  ]);
}

async function loadRequiredFont(font, loadFont, timeoutMs) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => loadFont(font)),
      new Promise((_resolve, reject) => { timer = setTimeout(() => reject(new Error("首页字体加载超时")), timeoutMs); })
    ]);
  } finally { clearTimeout(timer); }
}

export function preloadPlayerWindows({ loaders = moduleLoaders } = {}) {
  return Promise.allSettled(loaders.map((load) => Promise.resolve().then(load)));
}
