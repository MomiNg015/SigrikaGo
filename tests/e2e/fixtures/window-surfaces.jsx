import { createRoot } from "react-dom/client";
import "../../../src/styles.css";
import AppOverlays from "../../../src/app/AppOverlays.jsx";
import { UserProfileCard } from "../../../src/modals/UserProfileCard.jsx";
import { ConfirmModal } from "../../../src/modals/FeedbackModals.jsx";
import { CHARACTERS, characterListFromCatalog } from "../../../src/shared/characters.js";
import { DEFAULT_SITE_SETTINGS } from "../../../src/shared/siteSettings.js";

const query = new URLSearchParams(location.search);
const surface = query.get("surface") || "Warehouse";
const noop = () => {};
const user = {
  id: "surface-user", username: query.has("long") ? "星炬围棋部超长用户名测试123456" : "莫名",
  selectedCharacter: "denia", characterId: "denia", ownedCharacters: Object.keys(CHARACTERS),
  ownedDecorations: [], ownedItems: {}, coins: 500, rank: "3段", stars: 2, rating: 1200,
  wins: 5, losses: 3, draws: 1, relation: "none", likeCount: 4,
  recordStats: { totalGames: 9, wins: 5, losses: 3, draws: 1 }, recentResults: ["win", "loss"],
  characterStats: [{ characterId: "denia", totalGames: 9, wins: 5, losses: 3, draws: 1 }],
  ...(query.has("nameplate") ? { achievementEquipmentAssets: { nameplate: { id: "semantic", imageUrl: "/assets/achievements/semantic-nameplate.png" } } } : {})
};
const overlayNames = ["House", "Resume", "Achievements", "Personalization", "Recruitment", "Shop", "Warehouse", "Leaderboard", "Friends", "Mailbox", "Announcements", "MessageBoard", "Settings", "Watch"];
const flags = Object.fromEntries(overlayNames.flatMap(name => [[`show${name}`, surface === name], [`setShow${name}`, noop]]));
createRoot(document.getElementById("root")).render(
  <div className={`app-shell player-theme-enabled theme-bright-school${query.has("corrupt") ? " is-sigrika-corrupted" : ""}`}>
    {surface === "Profile" ? <div className="modal-backdrop profile-modal-backdrop"><UserProfileCard titleStickers user={user} characters={CHARACTERS} token="surface-fixture" onClose={noop} onAddFriend={noop} onAddBlacklist={noop} onOpenReplay={noop} /></div>
      : surface === "Confirm" ? <ConfirmModal title="确认操作" message="窗口背景检查" confirmText="确认" onConfirm={noop} onCancel={noop} />
      : <AppOverlays {...flags} user={user} token="surface-fixture" characters={CHARACTERS} characterListView={characterListFromCatalog(CHARACTERS)}
        audioSettings={{ muted: true }} musicTracks={[]} toasts={[]} siteSettings={DEFAULT_SITE_SETTINGS} visualTheme="bright-school"
        showToast={noop} updateUser={noop} selectCharacter={noop} applyStoneDecoration={noop} openReplay={noop} joinWatchRoom={noop}
        setAudioSettings={noop} setVisualTheme={noop} onMailboxSummaryChange={noop} onAnnouncementSummaryChange={noop} />}
  </div>
);
