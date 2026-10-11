import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { Star, ArrowUpRight, ArrowDownRight, ChevronsUp, ChevronsDown, ArrowRight, Plus, Minus } from "lucide-react";
import ResultModal from "../../../src/modals/gameLifecycle/ResultModal.jsx";
import { CHARACTERS } from "../../../src/shared/characters.js";
import "../../../src/styles.css";
import "./sample.css";

const designs = [
  { id: "trail", name: "星轨点亮", note: "变化发生在星槽本身，新增星亮起，失去的星留下空位。最紧凑。" },
  { id: "medal", name: "段位徽章", note: "段位成为徽章，升降变化挂在徽章一角。更有奖励感。" },
  { id: "compare", name: "前后对照", note: "本局前后并列或叠排，直接看见变化。阅读最明确。" },
];
const scenarios = {
  gain: { name: "得星", before: 2, after: 3, rankBefore: 3, rankAfter: 3, loss: false, label: "获得一颗星，三段三星" },
  loss: { name: "失星", before: 2, after: 1, rankBefore: 3, rankAfter: 3, loss: true, label: "失去一颗星，三段一星" },
  promote: { name: "升段", before: 4, after: 3, rankBefore: 3, rankAfter: 4, loss: false, label: "由三段晋升四段，四段三星" },
  demote: { name: "降段", before: 0, after: 2, rankBefore: 4, rankAfter: 3, loss: true, label: "由四段降至三段，三段两星" },
};
const params = new URLSearchParams(location.search);
function Slots({ count, capacity = 4, changed = -1, loss = false, quiet = false }) {
  return <span className={`vr-stars ${quiet ? "quiet" : ""}`} aria-hidden="true">
    {Array.from({ length: capacity }, (_, index) => <span key={index} className={`vr-slot ${index < count ? "filled" : ""} ${index === changed ? `changed ${loss ? "removed" : "added"}` : ""}`}>
      <Star strokeWidth={1.7} />
      {index === changed && <span className="vr-change-sign">{loss ? <Minus /> : <Plus />}</span>}
    </span>)}
  </span>;
}
function RankNumber({ value }) { return <span className="vr-number"><b>{value}</b><small>段</small></span>; }
function RankVisual({ design, state }) {
  const rankChange = state.rankBefore !== state.rankAfter;
  const capacity = state.rankAfter >= 4 ? 6 : 4;
  const beforeCapacity = state.rankBefore >= 4 ? 6 : 4;
  const Direction = state.loss ? ArrowDownRight : ArrowUpRight;
  const Chevrons = state.loss ? ChevronsDown : ChevronsUp;
  const changed = state.loss ? state.after : state.after - 1;
  return <span className={`vr-design vr-${design} ${state.loss ? "is-loss" : "is-gain"} ${rankChange ? "is-rank" : "is-star"}`} role="img" aria-label={state.label}>
    {design === "trail" && <>
      <span className="vr-caption">段位</span>
      {rankChange ? <span className="vr-rank-route"><span className="vr-previous"><RankNumber value={state.rankBefore} /></span><Direction /><span className="vr-next"><RankNumber value={state.rankAfter} /></span></span>
        : <span className="vr-rank-heading"><RankNumber value={state.rankAfter} /><Direction /></span>}
      <Slots count={state.after} capacity={capacity} changed={rankChange ? -1 : changed} loss={state.loss} />
    </>}
    {design === "medal" && <>
      <span className="vr-medal-wrap"><span className="vr-medallion"><RankNumber value={state.rankAfter} /></span>
        <span className="vr-pin">{rankChange ? <Chevrons /> : <><Star /><span>{state.loss ? <Minus /> : <Plus />}</span></>}</span>
      </span>
      <span className="vr-medal-foot">{rankChange && <span className="vr-from"><span>{state.rankBefore}段</span><ArrowRight /><b>{state.rankAfter}段</b></span>}<Slots count={state.after} capacity={capacity} /></span>
    </>}
    {design === "compare" && <>
      {rankChange ? <span className="vr-compare-ranks"><span className="vr-before"><small>本局前</small><RankNumber value={state.rankBefore} /></span><Direction /><span className="vr-after"><small>当前</small><RankNumber value={state.rankAfter} /></span></span>
        : <><span className="vr-rank-heading"><RankNumber value={state.rankAfter} /><Direction /></span><span className="vr-comparison"><span><small>本局前</small><Slots count={state.before} capacity={beforeCapacity} quiet /></span><span className="vr-current"><small>当前</small><Slots count={state.after} capacity={capacity} changed={changed} loss={state.loss} /></span></span></>}
      {rankChange && <Slots count={state.after} capacity={capacity} />}
    </>}
  </span>;
}

function Scene() {
  const design = designs.find((d) => d.id === params.get("design"))?.id ?? "trail";
  const state = scenarios[params.get("state")] ?? scenarios.gain;
  const root = useRef(null);
  const [slot, setSlot] = useState(null);
  const [destination, setDestination] = useState("");
  useEffect(() => { setSlot(root.current?.querySelector(".result-reward-rating") ?? null); }, [destination]);
  const user = { id: "sample", rank: "3段", stars: 2 };
  const room = { code: "SAMPLE", rated: true, players: [{ color: "black", characterId: "sigrika", user }], game: {
    phase: "finished", winner: { winnerColor: state.loss ? "white" : "black", text: state.loss ? "白方胜 3¾ 子" : "黑方胜 3¾ 子" },
    resultRewards: { sample: { rank: state.rankAfter - state.rankBefore, stars: state.after - state.before, rankAfter: `${state.rankAfter}段`, starsAfter: state.after, coins: state.loss ? 20 : 50 } },
  } };
  return <div ref={root} className="app-shell player-theme-enabled theme-bright-school vr-scene">
    <div className="vr-board" aria-hidden="true" />
    {!destination && <ResultModal room={room} user={user} characters={CHARACTERS} audioSettings={{ master: 0, voice: 0, sfx: 0 }} onClose={() => setDestination("对弈棋盘")} onLeaveRoom={() => setDestination("主界面大厅")} />}
    {!destination && slot && createPortal(<RankVisual design={design} state={state} />, slot)}
    {destination && <div className="vr-destination"><strong>{destination}</strong><button onClick={() => setDestination("")}>重新查看结果</button></div>}
  </div>;
}
function Workbench() {
  const [design, setDesign] = useState(designs.find((d) => d.id === params.get("design"))?.id ?? "trail");
  const [state, setState] = useState("gain");
  const [phone, setPhone] = useState(false);
  const [take, setTake] = useState(0);
  return <div className="vr-workbench">
    <header><div><h1>段位变化，也值得好好呈现。</h1><p>在现有结果窗口内比较三种视觉表达</p></div><div className="vr-controls">
      <label>结算状态<select aria-label="结算状态" value={state} onChange={(event) => setState(event.target.value)}>{Object.entries(scenarios).map(([id, scenario]) => <option key={id} value={id}>{scenario.name}</option>)}</select></label>
      <button aria-pressed={phone} onClick={() => setPhone(!phone)}>{phone ? "切换桌面" : "手机竖屏"}</button><button onClick={() => setTake(take + 1)}>重播变化</button>
    </div></header>
    <nav aria-label="设计方向">{designs.map((item, index) => <button key={item.id} aria-pressed={design === item.id} onClick={() => setDesign(item.id)}><small>0{index + 1}</small><strong>{item.name}</strong><span>{item.note}</span></button>)}</nav>
    <div className={`vr-preview ${phone ? "vr-phone" : ""}`}><iframe title="段位变化样板" src={`?scene=1&design=${design}&state=${state}&take=${take}`} /></div>
    <footer>独立视觉样板 · 可切换得星 / 失星 / 升段 / 降段 · 正式窗口保持现状</footer>
  </div>;
}
createRoot(document.getElementById("root")).render(params.has("scene") ? <Scene /> : <Workbench />);
