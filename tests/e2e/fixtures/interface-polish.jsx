import { useState } from "react";
import { createRoot } from "react-dom/client";
import "../../../src/styles.css";
import { CHARACTERS } from "../../../src/shared/characters.js";
import { createGameState } from "../../../src/shared/game.js";
import HomeScreen from "../../../src/home/HomeScreen.jsx";
import ResumeModal from "../../../src/modals/ResumeModal.jsx";
import { UserProfileCard } from "../../../src/modals/UserProfileCard.jsx";
import RoomScreen from "../../../src/room/RoomScreen.jsx";

const query = new URLSearchParams(location.search);
const characterId = query.get("character") || "sigrika";
const character = CHARACTERS[characterId] || CHARACTERS.sigrika;
const ownedCharacters = Object.keys(CHARACTERS);
const user = {
  id: "interface-review", username: query.has("long-name") ? "星炬学院围棋部新同学123456" : query.has("wide-name") ? "WWWWWWWW" : query.has("ascii-name") ? "fx2eee94" : "星炬同学",
  characterId: character.id, selectedCharacter: character.id, ownedCharacters,
  rank: "3段", stars: 2, rating: 1250, coins: 520, wins: 42, losses: 18, draws: 2,
  recordStats: { totalGames: 62, wins: 42, losses: 18, draws: 2 },
  recentResults: query.has("empty") ? [] : ["win", "loss", "win", "loss", "win", "win", "loss", "win", "win", "win"],
  modeStats: { spark: { totalGames: 62, wins: 42, losses: 18, draws: 2, rank: "3段", stars: 2, rating: 1250 } },
  characterStats: query.has("empty") ? [] : ownedCharacters.map((id, index) => ({ characterId: id, totalGames: 20 - index, wins: 12 - index, losses: 7, draws: 1 })),
  relation: "none", likeCount: 7,
  ...(query.has("equipped") ? { achievementEquipmentAssets: {
    nameplate: { id: "semantic", imageUrl: "/assets/achievements/semantic-nameplate.png" },
    ...(query.has("decorated") ? {
      title: { text: "星炬围棋部" },
      badge: { text: "围棋", imageUrl: "/assets/achievements/semantic-nameplate.png" }
    } : {})
  } } : {}),
  ...(query.has("costume") ? { equippedCostumes: { [character.id]: { portraitUrl: "/assets/costumes/portraits/sigrika-costume-01.webp", portraitScalePercent: 110, portraitOffsetXPercent: 4, portraitOffsetYPercent: -3 } } } : {})
};
const noop = () => {};
const players = ["black", "white"].map((color, index) => ({
  color, user: index ? { ...user, id: "review-opponent", username: "围棋部同学", characterId: "aemeath", selectedCharacter: "aemeath" } : user,
  characterId: index ? "aemeath" : character.id, character: index ? CHARACTERS.aemeath : character,
  connected: true, captures: 0,
  time: { main: 300, mainTotal: 300, byoYomi: 30, periodRemaining: 30, periods: 3 }
}));
const game = createGameState(players, { mode: "spark" });
const room = { code: "12345", mode: "spark", rated: false, role: "player", players, game, chat: [], spectators: [] };
// Browser tests can supply a real server-factory public room without importing server code here.
const specialRoomPayload = window.__interfaceSpecialRoomPayload;
if (specialRoomPayload) document.getElementById("root").classList.add("is-sigrika-corrupted");
window.__interfaceReviewActions = [];

function InterfaceReview() {
  const [surface, setSurface] = useState(query.get("surface") || "home");
  if (surface === "resume") return <ResumeModal user={user} token="fixture-profile" characterListView={Object.values(CHARACTERS)} onClose={() => setSurface("home")} onOpenAchievements={noop} onOpenPersonalization={noop} onOpenReplay={noop} />;
  if (surface === "profile") return <div className="modal-backdrop profile-modal-backdrop"><UserProfileCard titleStickers user={user} characters={CHARACTERS} token="fixture-profile" onClose={() => setSurface("home")} onAddFriend={noop} onAddBlacklist={noop} onOpenReplay={noop} /></div>;
  if (surface === "room") return <RoomScreen room={specialRoomPayload?.room || room} user={specialRoomPayload?.user || user} characters={CHARACTERS} replayStep={null} setReplayStep={noop} setPendingSkill={noop} audioSettings={{ master: 0 }} siteSettings={{}} onGameAction={specialRoomPayload ? action => window.__interfaceReviewActions.push(action) : noop} onScoringAction={noop} onBack={() => setSurface("home")} />;
  return <HomeScreen user={user} characters={CHARACTERS} audioSettings={{ master: 0 }} onOpenResume={() => setSurface("resume")} onNotice={noop} onLogout={noop} />;
}

createRoot(document.getElementById("root")).render(<InterfaceReview />);
