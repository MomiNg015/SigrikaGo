import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Stage from "../../../src/room/RoomBattleStage.jsx";
import RoomHeader from "../../../src/room/header/RoomHeader.jsx";
import { tutorialPlayersForSetup, createTutorialBattleRoom } from "../../../src/tutorial/tutorialBattleRoom.js";
import { createTutorialGameState } from "../../../src/tutorial/tutorialGameState.js";
import { CHARACTERS } from "../../../src/shared/characters.js";
import "../../../src/styles.css";
import "./production.css";

const params = new URLSearchParams(location.search);
const players = tutorialPlayersForSetup({ playerCharacterId: "sigrika", npcCharacterId: "denia" }, { id: "arcade-preview", username: "星炬部员" }, CHARACTERS);
players.forEach(player => {
  player.isTutorialPlayer = false;
  player.time = { main: 300, byoYomi: 30, periodRemaining: 30, periods: 3 };
});
const game = createTutorialGameState({ players });
const room = createTutorialBattleRoom({ game, players, code: "123456" });

function ProductionPreview() {
  const [compact, setCompact] = useState(innerWidth <= 900);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("正式组件 · 本地演示，不连接真实对局");
  const [state, setState] = useState(params.get("state") || "ready");
  const [coords, setCoords] = useState(true);
  const [confirm, setConfirm] = useState(null);
  useEffect(() => {
    const media = matchMedia("(max-width: 900px)");
    const change = () => setCompact(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const selectedPlayer = { ...players[0], character: { ...players[0].character, skill: { ...players[0].character.skill, name: state === "long" ? "星落之时·日灵的最后回响" : "星落日灵" } } };
  const selectedGame = { ...game, players: [selectedPlayer, players[1]], skillUses: { black: state === "spent" ? 0 : 2, white: 1 }, turn: state === "waiting" ? "white" : "black", mode: state === "gomoku" ? "gomoku" : game.mode, phase: state === "finished" ? "finished" : "playing", skillEnabled: state !== "gomoku" };
  const selectedRoom = { ...room, players: selectedGame.players, game: selectedGame };
  const theme = params.get("theme") || "bright-school";
  return <>
    <div className="arcade-preview-toolbar"><label>状态<select value={state} onChange={event => { setState(event.target.value); setPending(false); }}>
      <option value="ready">技能可用</option><option value="waiting">对手回合</option><option value="spent">次数耗尽</option><option value="long">长技能名</option><option value="gomoku">五子棋</option><option value="spectator">观战</option><option value="finished">对局结束</option>
    </select></label><a href="./tutorial.html">引导示意</a><span role="status">{status}</span></div>
    <div className={`app-shell player-theme-enabled theme-${theme}${params.has("corrupted") ? " is-sigrika-corrupted" : ""}`}>
      <main data-paper-battle className={`room-screen ${compact ? "mobile-room-screen" : "desktop-room-screen"}${params.has("duel") ? " sigrika-candy-duel-room" : ""}`}>
        <RoomHeader room={selectedRoom} roomGameInfo={{ moves: "47手", black: "星炬部员", white: "达妮娅" }} showCoords={coords} onToggleCoords={() => setCoords(!coords)} onBack={() => setStatus("退出演示")} onOpenSettings={() => setStatus("设置演示")} onOpenMessageBoard={() => setStatus("留言演示")}/>
        <Stage battleLayoutClassName={compact ? "mobile-battle-layout" : "battle-layout"} characters={CHARACTERS} displayRoom={selectedRoom} me={selectedPlayer} opponent={players[1]} user={players[0].user}
          role={state === "spectator" ? "spectator" : "player"} viewColor="black" showCoords={coords} skillAvailable pendingSkill={pending} setPendingSkill={setPending} onScoringAction={() => {}} handlePoint={() => setStatus("静态棋盘参照")} showPeoplePanel={false}
          hasAnyStones opponentConnected onPass={() => setConfirm("弃手")} onResign={() => setConfirm("认输")} onCountingRequest={() => setStatus("已发送数子申请")} onDrawRequest={() => setStatus("已发送和棋申请")}/>
      </main>
    </div>
    {confirm && <div className="modal-backdrop"><section className="modal confirm-modal" role="dialog" aria-modal="true" aria-label={`确认${confirm}`}><h2>确认{confirm}？</h2><p>本页仅演示操作，不影响真实对局。</p><div className="inline-actions"><button onClick={() => setConfirm(null)}>取消</button><button onClick={() => { setStatus(`已${confirm}`); setConfirm(null); }}>确认</button></div></section></div>}
  </>;
}
createRoot(document.getElementById("root")).render(<ProductionPreview/>);
