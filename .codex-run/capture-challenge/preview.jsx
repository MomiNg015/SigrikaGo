import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "../../src/styles.css";
import LeaderboardModal from "../../src/modals/LeaderboardModal.jsx";
import RoomHeader from "../../src/room/header/RoomHeader.jsx";
import ResultModal from "../../src/modals/gameLifecycle/ResultModal.jsx";
import HomeScreen from "../../src/home/HomeScreen.jsx";
import { CHARACTERS } from "../../src/shared/characters.js";

const user = { id: "a", username: "吃子挑战者", selectedCharacter: "sigrika", modeStats: {} };
const room = { matchSource: "practice", rated: false, practice: { challenge: "capture-challenge", result: { captures: 28, rank: 2, breakthrough: true } },
  players: [{ color: "black", characterId: "sigrika", user }], game: { phase: "finished", winner: { reason: "capture-challenge", text: "你这次提了28个子，位列总排名中的第2位，可喜可贺！" } } };
const kind = new URLSearchParams(location.search).get("kind");
function HeaderPreview() { const [coords, setCoords] = useState(false); return <div className="room-screen"><RoomHeader room={{ ...room, code: "PREVIEW" }} showCoords={coords} onToggleCoords={() => setCoords(!coords)} /></div>; }
createRoot(document.getElementById("root")).render(<div className="app-shell player-theme-enabled theme-bright-school">
  {kind === "header" ? <HeaderPreview /> : kind === "result" ? <ResultModal room={room} user={user} characters={CHARACTERS} onClose={() => {}} />
    : kind === "entry" ? <HomeScreen user={user} characters={CHARACTERS} matchModePickerOpen onStartPractice={() => {}} onStartMatch={() => {}} onMatchModePickerOpenChange={() => {}} />
    : <LeaderboardModal token="preview" user={user} characters={CHARACTERS} onClose={() => {}} />}
</div>);
