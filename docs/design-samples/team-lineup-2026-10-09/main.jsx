import { useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "../../../src/styles.css";
import "./variants.css";
import TeamLineupPicker from "../../../src/home/TeamLineupPicker.jsx";
import { CHARACTERS } from "../../../src/shared/characters.js";

const variants = [
  { id: "roster", name: "横向名册", description: "人物与回合信息并排，给下方选人区更多空间。" },
  { id: "stage", name: "人物舞台", description: "放大完整人物，回合信息收进底部纸签。" },
  { id: "timeline", name: "回合时间线", description: "用一条线连接三轮，减轻卡片边框。" }
];
const user = { id: "team-lineup-design-samples", username: "部员", ownedCharacters: Object.keys(CHARACTERS), itemEffects: {} };

function Samples() {
  const toolbar = useRef(null);
  useLayoutEffect(() => {
    const measure = () => document.documentElement.style.setProperty("--sample-toolbar-bottom", `${toolbar.current.getBoundingClientRect().bottom + 12}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(toolbar.current);
    return () => { observer.disconnect(); document.documentElement.style.removeProperty("--sample-toolbar-bottom"); };
  }, []);
  const [variant, setVariant] = useState(new URLSearchParams(location.search).get("variant") || "roster");
  const [lineup, setLineup] = useState(["sigrika", "aemeath", "mornye"]);
  const [resetVersion, setResetVersion] = useState(0);
  const [open, setOpen] = useState(true);
  const [notice, setNotice] = useState("");
  const current = variants.find(item => item.id === variant) || variants[0];
  return <>
    <aside ref={toolbar} className="sample-toolbar" aria-label="视觉样板切换">
      <nav aria-label="三个样板">{variants.map((item, index) => <button key={item.id} type="button" aria-pressed={current.id === item.id} onClick={() => { setVariant(item.id); setNotice(""); }}>{index + 1} · {item.name}</button>)}</nav>
      <p>{current.description}</p>
      <button className="sample-reset" type="button" onClick={() => { setLineup(["sigrika", "aemeath", "mornye"]); setResetVersion(value => value + 1); setOpen(true); setNotice(""); }}>{open ? "重置阵容" : "打开阵容"}</button>
      <output aria-live="polite">{notice}</output>
    </aside>
    <div className="app-shell player-theme-enabled theme-bright-school lineup-sample" data-variant={current.id}>
      {open && <TeamLineupPicker key={resetVersion} user={user} characters={CHARACTERS} audioSettings={{ master: 0, voice: 0 }} initialLineup={lineup} onChange={setLineup} onClose={() => setOpen(false)} onConfirm={() => setNotice("阵容已确认。")} />}
    </div>
  </>;
}

createRoot(document.getElementById("root")).render(<Samples />);
