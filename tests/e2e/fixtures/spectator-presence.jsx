import { useState } from "react";
import { createRoot } from "react-dom/client";
import "../../../src/styles.css";
import RoomScreen from "../../../src/room/RoomScreen.jsx";
import ResultModal from "../../../src/modals/gameLifecycle/ResultModal.jsx";
import { CHARACTERS } from "../../../src/shared/characters.js";
import { createGameState } from "../../../src/shared/game.js";

const query = new URLSearchParams(location.search);
const noop = () => {};
const names = ["青柠汽水", "晚风", "抱着棋盘看星星", "小鱼", "今天也要认真下棋", "椰子", "夜航", "晴天", "白桃", "远山"];
const characterIds = Object.keys(CHARACTERS).filter((id) => id !== "baconbits");
const users = Array.from({ length: 20 }, (_, index) => ({
  id: `watcher-${index}`, username: `${names[index % names.length]}${index > 9 ? index : ""}`,
  selectedCharacter: characterIds[index % characterIds.length], rank: "1段", rating: 1000,
  ...(query.has("failed") && index === 0 ? { equippedCostumes: { [characterIds[0]]: { portraitUrl: "/missing-costume.png" } } } : {})
}));
const players = ["sigrika", "denia"].map((id, index) => ({
  color: index ? "white" : "black", characterId: id, character: CHARACTERS[id],
  user: { id: `player-${index}`, username: index ? "午后的一杯茶" : "星炬棋手", rank: index ? "12级" : "9段", rating: 1200, selectedCharacter: id },
  captures: index ? 1 : 3, skillRemovals: 0, connected: true,
  time: { main: 300, byoYomi: 30, periodRemaining: 30, periods: 3 }
}));
const game = createGameState(players);
game.phase = "playing";
game.moveNumber = 14;
for (const [index, point] of game.points.entries()) {
  if ([60, 61, 79, 80, 98, 99, 180, 181, 199, 200, 218, 219].includes(index)) point.stone = index % 2 ? "black" : "white";
}

function Fixture() {
  const [count, setCount] = useState(Number(query.get("count") ?? 6));
  const [revision, setRevision] = useState(0);
  const [pendingSkill, setPendingSkill] = useState(false);
  const spectators = users.slice(0, count).map((user) => ({ user }));
  const room = { code: "12345", role: query.has("self") ? "spectator" : "player", mode: "spark", rated: true, players, game, chat: [], spectators, revision,
    ...(query.has("special") ? { sigrikaCandyDuel: { humanColor: "black", botColor: "white", presentation: null } } : {}) };
  return <>
    <RoomScreen room={room} user={query.has("self") ? users[0] : players[0].user} token="presence-fixture" characters={CHARACTERS}
      replayStep={null} pendingSkill={pendingSkill} setPendingSkill={setPendingSkill} audioSettings={{ master: 0, bgm: 0, sfx: 0, voice: 0 }}
      onOpenSettings={noop} onOpenMessageBoard={noop} onBack={noop} onGameAction={noop}
      onCountingRequest={noop} onCountingRespond={noop} onDrawRequest={noop} onDrawRespond={noop}
      onScoringAction={noop} onOpenReplay={noop} setReplayStep={noop} />
    {query.has("result") && <ResultModal
      room={{ ...room, game: { ...game, phase: "finished", winner: { winnerColor: query.get("result") === "draw" ? null : query.get("result") === "loss" ? "white" : "black", text: "对局结束，14手" } } }}
      user={players[0].user} characters={CHARACTERS} audioSettings={{ muted: true }} onClose={noop} onLeaveRoom={noop} />}
    {query.has("controls") && <div style={{ position: "fixed", right: 4, top: 4, zIndex: 5000, background: "white" }}>
      <button onClick={() => setCount((value) => Math.min(20, value + 1))}>增加观战者</button>
      <button onClick={() => setCount((value) => Math.max(0, value - 1))}>减少观战者</button>
      <button onClick={() => setRevision((value) => value + 1)}>刷新房间数据</button>
    </div>}
  </>;
}
createRoot(document.getElementById("root")).render(<Fixture />);
