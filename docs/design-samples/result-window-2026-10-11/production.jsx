import { useState } from "react";
import { createRoot } from "react-dom/client";
import ResultModal from "../../../src/modals/gameLifecycle/ResultModal.jsx";
import { CHARACTERS } from "../../../src/shared/characters.js";
import { useOverlayActions } from "../../../src/app/useOverlayActions.js";
import "../../../src/styles.css";

const params = new URLSearchParams(location.search);
const loss = params.get("outcome") === "loss";
const changes = { star: { rank: 0, stars: loss ? -1 : 1, rankAfter: "3段", starsAfter: loss ? 1 : 3 },
  rank: { rank: loss ? -1 : 1, stars: loss ? 4 : -2, rankAfter: loss ? "3段" : "4段", starsAfter: 2 },
  points: { rank: 0, stars: 0, rating: loss ? -250 : 200, rankAfter: "9段", starsAfter: 0, ratingAfter: 1200 } };
const user = { id: "self", username: "不应显示的用户名", rank: "3段", stars: 2 };
const initialRoom = { code: "RESULT-PREVIEW", role: "player", rated: true,
  players: [{ color: "black", characterId: "sigrika", user }, { color: "white", characterId: "denia", user: { id: "other" } }],
  game: { phase: "finished", winner: { winnerColor: params.get("outcome") === "draw" ? null : loss ? "white" : "black", text: loss ? "白方胜 3¾ 子" : "黑方胜 3¾ 子" },
    resultRewards: { self: { coins: loss ? 20 : 50, ...changes[params.get("delta") ?? "star"] } } } };
function Preview() {
  const [room, setRoom] = useState(initialRoom);
  const [view, setView] = useState("room");
  const [dismissed, setDismissedResultRoom] = useState("");
  const [, setReplayStep] = useState(null);
  const [, setPendingSkill] = useState(null);
  const actions = useOverlayActions({ room, view, setRoom, setView, setDismissedResultRoom, setReplayStep, setPendingSkill });
  return <div className="app-shell player-theme-enabled theme-bright-school" style={{ minHeight: "100dvh" }}>
    <p style={{ padding: 24 }}>{view === "home" ? "主界面大厅" : "对弈棋盘"}</p>
    {room && !dismissed && <ResultModal room={room} user={user} characters={CHARACTERS} audioSettings={{ master: 0, voice: 0, sfx: 0 }} onClose={actions.closeResultModal} onLeaveRoom={actions.leaveResultRoom} />}
    <button onClick={() => { setRoom(initialRoom); setView("room"); setDismissedResultRoom(""); }}>重新展示结果</button>
  </div>;
}
createRoot(document.getElementById("root")).render(<Preview />);
