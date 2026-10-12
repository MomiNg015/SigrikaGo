import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import RoomHeader from "../../../src/room/header/RoomHeader.jsx";
import Stage from "../../../src/room/RoomBattleStage.jsx";
import ActionBar from "../../../src/room/ActionBar.jsx";
import { tutorialPlayersForSetup, createTutorialBattleRoom } from "../../../src/tutorial/tutorialBattleRoom.js";
import { createTutorialGameState } from "../../../src/tutorial/tutorialGameState.js";
import { CHARACTERS } from "../../../src/shared/characters.js";
import HeaderDesign, { directions } from "./Headers.jsx";
import "../../../src/styles.css";
import "./sample.css";

const params = new URLSearchParams(location.search);
const initial = directions.some(({ id }) => id === params.get("view")) ? params.get("view") : "score";
const embedded = params.has("embed");
const players = tutorialPlayersForSetup({ playerCharacterId: "sigrika", npcCharacterId: "denia" }, { id: "header-preview", username: "星炬部员" }, CHARACTERS);
players.forEach((player) => {
  player.isTutorialPlayer = false;
  player.time = { main: 300, byoYomi: 30, periodRemaining: 30, periods: 3 };
  player.user.rank = "3段";
  player.user.rating = 1600;
});
const game = createTutorialGameState({ players });
const room = createTutorialBattleRoom({ game, players, code: "123456" });
const playerRole = "player";

function PreviewHeader({ variant, moves, longNames, team, coords, setCoords, notify }) {
  const ref = useRef(null);
  const [target, setTarget] = useState(null);
  useLayoutEffect(() => { setTarget(ref.current.querySelector(".room-title-stack")); }, []);
  return <div ref={ref} className={`bh-header-host bh-variant-${variant}`}>
    <RoomHeader room={room} showCoords={coords} onToggleCoords={() => setCoords(!coords)} onOpenSettings={() => notify("设置按钮 · 本地样板")} onOpenMessageBoard={() => notify("留言板按钮 · 本地样板")} onBack={() => notify("退出按钮 · 本地样板，不会退出当前对局")}/>
    {target && createPortal(<HeaderDesign variant={variant} moves={moves} longNames={longNames} team={team}/>, target)}
  </div>;
}

function Sample() {
  const [variant, setVariant] = useState(initial);
  const [moves, setMoves] = useState(params.has("moves") ? Math.max(0, Math.min(999, Number(params.get("moves")) || 0)) : 47);
  const [longNames, setLongNames] = useState(params.has("long"));
  const [team, setTeam] = useState(params.has("team"));
  const [coords, setCoords] = useState(true);
  const [phone, setPhone] = useState(false);
  const [compact, setCompact] = useState(matchMedia("(max-width: 768px)").matches);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("仅 header 视觉样板 · 棋盘为静态参照");
  useEffect(() => {
    const media = matchMedia("(max-width: 768px)");
    const update = () => setCompact(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const handle = (event) => {
      if (event.target.closest("input, select, textarea") || event.altKey || event.metaKey || event.ctrlKey) return;
      const index = Number(event.key) - 1;
      if (directions[index]) setVariant(directions[index].id);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);
  const describe = directions.find(({ id }) => id === variant);
  const notify = (text) => setMessage(text);
  return <div className="bh-preview">
    {!embedded && <div className="bh-workbench">
      <div className="bh-workbench-heading"><b>对弈 HEADER</b><span>三种构图 / 右上按钮沿用原版</span></div>
      <nav aria-label="Header 样板">{directions.map(({ id, title }, index) => <button key={id} aria-pressed={variant === id} onClick={() => setVariant(id)}><small>0{index + 1}</small>{title}</button>)}</nav>
      <div className="bh-demo-controls"><button onClick={() => setMoves(Math.max(0, moves - 1))} disabled={moves === 0} aria-label="减少手数">−</button><label>手数<input aria-label="手数" type="number" min="0" max="999" value={moves} onChange={(event) => setMoves(Math.max(0, Math.min(999, Number(event.target.value) || 0)))}/></label><button onClick={() => setMoves(Math.min(999, moves + 1))} disabled={moves === 999} aria-label="增加手数">＋</button><button onClick={() => setLongNames(!longNames)} aria-pressed={longNames}>长名称</button><button onClick={() => setTeam(!team)} aria-pressed={team}>组队局</button><button className="bh-phone-switch" onClick={() => setPhone(!phone)} aria-pressed={phone}>手机预览</button></div>
    </div>}
    {!embedded && <div className="bh-caption"><span>{describe.note}</span><span role="status">{message}</span></div>}
    {phone && !compact && !embedded ? <div className="bh-phone"><iframe title="Header 手机预览" src={`?embed&view=${variant}&moves=${moves}${longNames ? "&long" : ""}${team ? "&team" : ""}`}/></div> : <div className="app-shell player-theme-enabled theme-bright-school bh-scene">
      <main className={`room-screen ${compact ? "mobile-room-screen" : "desktop-room-screen"}`}>
        <PreviewHeader variant={variant} moves={moves} longNames={longNames} team={team} coords={coords} setCoords={setCoords} notify={notify}/>
        <Stage battleLayoutClassName={compact ? "mobile-battle-layout" : "battle-layout"} characters={CHARACTERS} displayRoom={room} me={players[0]} opponent={players[1]} user={players[0].user} role={playerRole} viewColor="black" showCoords={coords} skillAvailable pendingSkill={pending} setPendingSkill={setPending} onScoringAction={() => notify("静态棋盘参照")} showPeoplePanel={false} actionPanelOverride={<ActionBar role={playerRole} mode={game.mode} phase="playing" me={players[0]} isMyTurn skillEnabled skillName="星辉符文" skillUses={1} skillAvailable pendingSkill={pending} setPendingSkill={setPending} countingEnabled drawEnabled opponentConnected hasAnyStones onPass={() => notify("停一手 · 本地样板")} onCountingRequest={() => notify("数子 · 本地样板")} onDrawRequest={() => notify("求和 · 本地样板")} onResign={() => notify("认输 · 本地样板")}/>}/>
      </main>
    </div>}
    {embedded && <p className="bh-embedded-status" role="status">{message}</p>}
  </div>;
}

createRoot(document.getElementById("root")).render(<Sample/>);
