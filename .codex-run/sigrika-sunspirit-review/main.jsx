import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Board from "/src/room/Board.jsx";
import { loadPixiModule } from "/src/room/pixiPrewarm.js";
import "/src/styles.css";

const muted = { master: 0, sfx: 0, muted: { master: true } };
function Preview() {
  const [cast, setCast] = useState(null);
  const [resolved, setResolved] = useState(false);
  const [target, setTarget] = useState("6,6");
  const timer = useRef(null);
  function play(options = {}) {
    clearTimeout(timer.current);
    const next = { target: options.target || target, adjacent: options.adjacent || false, enabled: options.enabled !== false, id: `preview-${Date.now()}` };
    setCast(next);
    setResolved(false);
    timer.current = setTimeout(() => setResolved(true), 4000);
  }
  useEffect(() => { window.sunspiritReview = { play, ready: loadPixiModule() }; }, [target]);
  const pendingSkill = cast && !resolved ? { id: cast.id, effectType: "erase-point", characterId: "sigrika", targetId: cast.target, affectedPointIds: [cast.target], bannerDurationMs: 2000, boardEffectDurationMs: 1800, effectsEnabled: cast.enabled } : null;
  const points = Array.from({ length: 169 }, (_, index) => {
    const x = index % 13, y = Math.floor(index / 13), id = `${x},${y}`;
    const valid = !(resolved && id === cast?.target) && !(cast?.adjacent && id === "5,6");
    return { id, x, y, valid, stone: valid && ["4,5", "7,7", "8,6", "5,8"].includes(id) ? (x % 2 ? "white" : "black") : null };
  });
  const game = { size: 13, mode: "spark", phase: pendingSkill ? "skill-preview" : "playing", points, pendingSkill, history: [], skillEnabled: true, scoring: {}, passives: {} };
  return <main className="review-shell app-shell player-theme-enabled theme-bright-school">
    <header><h1>星落日灵</h1><p>星星落地 → 星芒爆发 → 日灵显现</p><div className="review-controls"><select aria-label="目标位置" value={target} onChange={e => setTarget(e.target.value)}><option value="6,6">中央</option><option value="0,0">左上角</option><option value="12,12">右下角</option></select><button onClick={() => play()}>播放演出</button><button onClick={() => play({target:"6,6",adjacent:true})}>相邻无效点</button></div></header>
    <section className="review-stage"><Board game={game} showCoords={false} showMoves={false} pendingSkill={null} stoneJitter={false} skillEffectsEnabled={cast?.enabled !== false} audioSettings={muted} onPoint={() => {}} onNeutral={() => {}} onBoardSurface={() => {}} /></section>
    <p className="review-status">{pendingSkill ? "演出中" : resolved ? "已落地 · 日灵安睡" : "点击播放，前两秒为原有横幅预留时间"}</p>
  </main>;
}
createRoot(document.getElementById("root")).render(<Preview />);
const style = document.createElement("style");
style.textContent = `body{margin:0}.review-shell{min-height:100dvh;padding:18px;display:flex;flex-direction:column;align-items:center;gap:18px}.review-shell header{text-align:center}.review-shell h1{font-size:24px;margin:0}.review-shell p{margin:8px 0;font-size:14px}.review-controls{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}.review-controls button,.review-controls select{min-height:40px;padding:6px 12px}.review-stage{width:min(620px,calc(100vw - 36px));aspect-ratio:1;flex-shrink:0}.review-stage .board-wrap{width:100%;height:100%;display:block;padding:0;margin:0;--board-size:100%}.review-stage .board{width:100%;height:100%;margin:0;aspect-ratio:1}.review-status{min-height:20px}`;
document.head.append(style);
