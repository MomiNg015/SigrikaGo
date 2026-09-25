import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "../../../src/styles.css";
import { CHARACTERS } from "../../../src/shared/characters.js";
import { createGameState } from "../../../src/shared/game.js";
import TeamLineupPicker from "../../../src/home/TeamLineupPicker.jsx";
import HomeScreen from "../../../src/home/HomeScreen.jsx";
import OpeningModal from "../../../src/modals/gameLifecycle/OpeningModal.jsx";
import { PRACTICE_BOT_PORTRAIT_URL } from "../../../src/shared/practiceMode.js";
import RoomScreen from "../../../src/room/RoomScreen.jsx";
import { HouseReplayDialog } from "../../../src/modals/house/HouseNestedDialogs.jsx";
import WindowBookmarkTabs from "../../../src/modals/WindowBookmarkTabs.jsx";
import WindowTitleSticker from "../../../src/modals/WindowTitleSticker.jsx";

function BookmarkFixture() {
  const [count, setCount] = useState(6);
  const [selected, setSelected] = useState(0);
  return <div className="modal-backdrop"><section role="dialog" className="small-modal window-sticker-host window-bookmark-host">
    <WindowTitleSticker titleKey="settings" />
    <WindowBookmarkTabs aria-label="窗口标签">
      {Array.from({ length: count }, (_, index) => <button key={index} type="button" aria-selected={selected === index} onClick={() => setSelected(index)}>选项标签{index + 1}</button>)}
    </WindowBookmarkTabs>
    <p>当前标签 {selected + 1}</p>
    <button type="button" onClick={() => setCount(count === 6 ? 3 : 6)}>切换标签数量</button>
  </section></div>;
}

const user = { id: "team-one", username: "队际赛测试", selectedCharacter: "sigrika", ownedCharacters: ["sigrika", "aemeath", "nabomo"] };
const noop = () => {};
const root = createRoot(document.getElementById("root"));
const players = ["black", "white"].map((color, index) => ({
  color, user: index ? { ...user, id: "team-two", username: "对手" } : user,
  characterId: "sigrika", character: CHARACTERS.sigrika, connected: true, captures: 0,
  time: { main: 300, mainTotal: 300, byoYomi: 30, periodRemaining: 30, periods: 3 },
  teamLineup: user.ownedCharacters.map((id, slot) => index && slot > 0
    ? { characterId: null, character: null, status: "hidden" }
    : { characterId: id, character: CHARACTERS[id], status: slot === 0 ? "active" : "waiting" })
}));
const game = createGameState(players, { mode: "team" });
const room = { code: "12345", mode: "team", rated: false, team: { round: 1 }, role: "player", players, game, chat: [], spectators: [] };
const surface = new URLSearchParams(location.search).get("surface");
const records = Array.from({ length: 12 }, (_, index) => ({ id: String(index), mode: "team", rated: false, createdAt: "2026-09-23T12:00:00Z", blackName: "己方", whiteName: "对手", blackCharacter: "sigrika", whiteCharacter: "aemeath", resultText: "黑胜", moveCount: 100 }));
const captureRoom = {
  ...room, team: undefined, mode: "spark", matchSource: "practice",
  practice: { challenge: "capture-challenge" }, __openingPresentation: true,
  openingEndsAt: Date.now() + 3000,
  players: [players[0], { color: "white", isBot: true, botProfile: { name: "准时宝", portraitUrl: PRACTICE_BOT_PORTRAIT_URL } }]
};
root.render(surface === "bookmarks"
  ? <BookmarkFixture />
  : surface === "capture-opening"
  ? <OpeningModal room={captureRoom} player={players[0]} characters={CHARACTERS} />
  : surface === "modes"
  ? <HomeScreen user={user} characters={CHARACTERS} matchModePickerOpen onStartMatch={noop} onPracticeStart={() => { window.practiceStarted = true; }} />
  : surface === "replays"
  ? <HouseReplayDialog titleStickers characterListView={Object.values(CHARACTERS)} currentUser={user} onClose={noop} pagination={{ records, loading: false, error: null, onScroll: noop }} />
  : surface === "lineup"
  ? <TeamLineupPicker user={user} characters={CHARACTERS} onClose={noop} onStart={(mode, lineup) => { window.teamSelection = { mode, lineup }; }} />
  : <RoomScreen room={room} user={user} characters={CHARACTERS} replayStep={null} setReplayStep={noop} setPendingSkill={noop} audioSettings={{ master: 0 }} siteSettings={{}} onGameAction={noop} onScoringAction={noop} onBack={noop} />);
