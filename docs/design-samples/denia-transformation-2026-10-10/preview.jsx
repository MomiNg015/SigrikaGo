import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import RoomScreen from "/src/room/RoomScreen.jsx";
import { CHARACTERS } from "/src/shared/characters.js";
import { createGameState } from "/src/shared/game.js";
import "/src/styles.css";

const player = { color: "black", characterId: "denia", character: CHARACTERS.denia,
  user: { id: "preview", username: "达妮娅", rank: "初段", rating: 1200 },
  time: { main: 600, periods: 3, byoYomi: 30, periodRemaining: 30 } };
const players = [player, { ...player, color: "white", characterId: "sigrika", character: CHARACTERS.sigrika, user: { ...player.user, id: "opponent", username: "西格莉卡" } }];
const initial = createGameState(players);
const noop = () => {};

function Preview() {
  const [cast, setCast] = useState(0);
  const [resolved, setResolved] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const banner = cast && !resolved ? { id: `denia-preview-${cast}`, characterId: "denia", color: "black", effectType: "flip-stone",
    effectsEnabled: !disabled, bannerDurationMs: disabled ? 2000 : 3200 } : null;
  const game = { ...initial, phase: banner ? "skill-preview" : "playing", pendingSkill: banner, history: resolved ? [{ type: "skill", color: "black", effectType: "flip-stone" }] : [] };
  const room = { code: "PREVIEW", mode: "spark", role: "player", players, game, spectators: [], chat: [], rated: false, unlimitedTime: true };
  useEffect(() => {
    if (!cast) return undefined;
    const timer = setTimeout(() => setResolved(true), disabled ? 2000 : 4240);
    return () => clearTimeout(timer);
  }, [cast, disabled]);
  return <div className="app-shell player-theme-enabled theme-bright-school" style={{ minHeight: "100dvh", padding: "24px 16px" }}>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 30 }}>
      <button onClick={() => { setResolved(false); setCast(value => value + 1); }}>释放技能</button>
      <button onClick={() => { setCast(0); setResolved(false); }}>重置本局</button>
      <label><input type="checkbox" checked={disabled} onChange={event => { setCast(0); setResolved(false); setDisabled(event.target.checked); }} />关闭特效</label>
    </div>
    <RoomScreen room={room} user={player.user} characters={CHARACTERS} replayStep={null} setReplayStep={noop}
      pendingSkill={false} setPendingSkill={noop} audioSettings={{ master: 0, voice: 0, bgm: 0, sfx: 0 }} siteSettings={{ skillEffectsEnabled: !disabled }}
      onOpenSettings={noop} onOpenMessageBoard={noop} onBack={noop} onGameAction={noop} onCountingRequest={noop}
      onCountingRespond={noop} onDrawRequest={noop} onDrawRespond={noop} onScoringAction={noop} onOpenReplay={noop} onToast={noop} />
  </div>;
}

createRoot(document.getElementById("root")).render(<Preview />);
