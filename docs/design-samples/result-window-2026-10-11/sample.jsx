import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import ResultCharacterPortrait from "../../../src/modals/gameLifecycle/ResultCharacterPortrait.jsx";
import "../../../src/styles/modals/result-modal.css";
import "./sample.css";

const directions = [
  { id: "side", name: "侧身破框", description: "大立绘在左，结算集中在右。熟悉、紧凑，适合高频对局。" },
  { id: "top", name: "顶部探出", description: "角色站在纸卡上方，结算在下方收拢。人物最醒目，竖向感更强。" },
  { id: "slash", name: "斜切战报", description: "斜切色纸托住立绘，大标题与横向收益形成更强的胜负瞬间。" },
];
const characters = [
  { id: "sigrika", name: "西格莉卡" }, { id: "denia", name: "达妮娅" },
  { id: "aemeath", name: "爱弥斯" }, { id: "lynae", name: "琳奈" },
  { id: "mornye", name: "莫宁" }, { id: "chisa", name: "千咲" },
  { id: "changli", name: "长离" }, { id: "qiuyuan", name: "秋远" },
  { id: "nabomo", name: "纳波莫" },
];
const query = new URLSearchParams(location.search);
const initial = (key, allowed, fallback) => allowed.includes(query.get(key)) ? query.get(key) : fallback;

function Board() {
  return <div className="board-scene" aria-hidden="true">
    <div className="room-caption"><span>星炬对弈</span><span>对局结束</span></div>
    <div className="board-grid">{Array.from({ length: 30 }, (_, i) => <i key={i}
      className={i % 2 ? "white" : "black"} style={{ left: `${(3 + (i * 7) % 9) / 12 * 100}%`, top: `${(2 + (i * 5 + Math.floor(i / 9)) % 9) / 12 * 100}%` }} />)}</div>
    <div className="room-foot">黑方 08:42 <span>第 126 手</span> 白方 06:18</div>
  </div>;
}

function Scene() {
  const direction = initial("direction", directions.map((d) => d.id), "side");
  const outcome = initial("outcome", ["win", "loss", "draw"], "win");
  const mode = initial("mode", ["ranked", "friendly", "team", "practice", "challenge"], "ranked");
  const character = characters.find((c) => c.id === query.get("character")) ?? characters[0];
  const [open, setOpen] = useState(true);
  const closeRef = useRef(null);
  const reopenRef = useRef(null);
  useEffect(() => { (open ? closeRef : reopenRef).current?.focus({ preventScroll: true }); }, [open]);
  const loss = outcome === "loss";
  const label = mode === "challenge" ? (loss ? "挑战未完成" : "挑战完成") : loss ? "输掉了…" : outcome === "draw" ? "平局啦" : "赢了耶！";
  const detail = mode === "challenge" ? (loss ? "本次挑战未满 100 手" : "完成 100 手 · 提子 36 枚") : outcome === "draw" ? "双方握手言和" : loss ? "白方胜 3¾ 子" : "黑方胜 3¾ 子";
  return <main className={`scene direction-${direction} outcome-${outcome}`}>
    <Board />
    {open ? <div className="result-layer" onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
      <section className="result-sample" role="dialog" aria-modal="true" aria-labelledby="outcome-title" aria-describedby="result-detail">
        <div className="paper" aria-hidden="true" />
        <div className="portrait-zone result-winner">
          <div className="portrait-art">
            <ResultCharacterPortrait character={character} outcome={outcome} />
            {loss && <img className="weather" src="/assets/effects/result-defeat-rain.gif" alt="" aria-hidden="true" />}
            {loss && <span className="still-cloud" aria-hidden="true">☁</span>}
          </div>
        </div>
        <div className="result-copy">
          <h1 id="outcome-title">{label}</h1>
          <p id="result-detail" className="detail">{detail}</p>
          {mode === "friendly" && <p className="note">友谊对局 · 不计入积分与段位</p>}
          {mode === "team" && <p className="note">队际赛 · 独立段位，不奖励金币</p>}
          {mode === "challenge" && <p className="note">{loss ? "成绩不计入排行榜" : "突破个人最高排名！"}</p>}
          {mode !== "practice" && mode !== "challenge" && <div className="rewards" aria-label="本局收益">
            {mode !== "friendly" && <div className="rank-reward"><span>段位</span><strong>三段 <b aria-label={loss ? "一星" : "三星"}>{loss ? "★☆☆" : "★★★"}</b></strong></div>}
            {mode !== "team" && <div className="coin-reward"><span>金币</span><strong>+{loss ? "10" : outcome === "draw" ? "15" : "30"}</strong></div>}
          </div>}
          {mode === "team" && <div className="lineups"><p>黑方 · 西格莉卡 → 长离 → 秋远</p><p>白方 · 达妮娅 → 千咲 → 爱弥斯</p></div>}
          <button ref={closeRef} className="confirm" onClick={() => setOpen(false)}>返回棋盘 <span aria-hidden="true">↗</span></button>
        </div>
      </section>
    </div> : <button className="reopen" ref={reopenRef} onClick={() => setOpen(true)}>重新查看结果</button>}
  </main>;
}

function Workbench() {
  const [direction, setDirection] = useState(initial("direction", directions.map((d) => d.id), "side"));
  const [outcome, setOutcome] = useState("win");
  const [mode, setMode] = useState("ranked");
  const [character, setCharacter] = useState("sigrika");
  const [phone, setPhone] = useState(false);
  const [revision, setRevision] = useState(0);
  const params = new URLSearchParams({ scene: "1", direction, outcome, mode, character, revision: String(revision) });
  const selected = directions.find((d) => d.id === direction);
  return <div className="workbench">
    <header className="tools">
      <div className="heading"><strong>对局结果窗口</strong><span>三种布局 · 交互样板</span></div>
      <nav aria-label="样板方案">{directions.map((d, index) => <button key={d.id} aria-pressed={direction === d.id} onClick={() => setDirection(d.id)}><small>0{index + 1}</small>{d.name}</button>)}</nav>
      <div className="settings">
        <label>结果<select value={outcome} onChange={(e) => setOutcome(e.target.value)}><option value="win">胜利</option><option value="loss">败北</option><option value="draw">平局</option></select></label>
        <label>角色<select value={character} onChange={(e) => setCharacter(e.target.value)}>{characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>玩法<select value={mode} onChange={(e) => setMode(e.target.value)}><option value="ranked">升降级对局</option><option value="friendly">友谊对局</option><option value="team">队际赛</option><option value="practice">陪练</option><option value="challenge">吃子挑战</option></select></label>
        <button aria-pressed={phone} onClick={() => setPhone(!phone)}>{phone ? "切换桌面" : "手机竖屏"}</button>
        <button onClick={() => setRevision(revision + 1)}>重新展示</button>
      </div>
    </header>
    <div className="direction-note"><strong>{selected.name}</strong><span>{selected.description}</span></div>
    <div className={`preview-holder ${phone ? "phone-preview" : ""}`}><iframe title={`${selected.name}交互预览`} src={`?${params}`} /></div>
    <footer>本地模拟结算 · 无用户名 · 复用现有胜负表情、胜利跳动与败北乌云</footer>
  </div>;
}

createRoot(document.getElementById("root")).render(query.has("scene") ? <Scene /> : <Workbench />);
