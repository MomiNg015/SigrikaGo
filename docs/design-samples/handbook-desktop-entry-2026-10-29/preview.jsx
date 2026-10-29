import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { RotateCcw } from "lucide-react";
import "../../../src/styles.css";
import HouseModal from "../../../src/modals/HouseModal.jsx";
import { CHARACTERS, characterListFromCatalog } from "../../../src/shared/characters.js";
import { resolveHandbookPortrait } from "../../../src/shared/handbookPortraits.js";
import "./sample.css";

const characters = characterListFromCatalog(CHARACTERS);
const user = {
  id: "handbook-entry-sample", selectedCharacter: "sigrika",
  ownedCharacters: characters.map(({ id }) => id),
  equippedCostumes: {}, ownedDecorations: [], ownedMusicIds: [], itemEffects: {}
};
const audioSettings = { muted: true };
const musicTracks = [];

function Preview() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(true);
  const [run, setRun] = useState(0);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    let alive = true;
    const portraits = characters.map(character => {
      const img = new Image();
      img.src = resolveHandbookPortrait(character, { user, itemEffects: {}, chibi: true }).src;
      return img.decode();
    });
    Promise.allSettled([...portraits, document.fonts.ready]).then(() => {
      if (alive) setReady(true);
    });
    return () => { alive = false; };
  }, []);
  const replay = () => { setOpen(true); setRun(value => value + 1); };
  return <div className={`handbook-entry-sample${slow ? " is-slow" : ""}`}>
    <header className="entry-review-bar">
      <div className="entry-review-heading">
        <span>动效样板</span>
        <h1>部员手册 · 上下交错入场</h1>
      </div>
      <div className="entry-review-controls">
        <button type="button" aria-pressed={slow} onClick={() => { setSlow(value => !value); replay(); }} disabled={!ready}>慢速观察</button>
        <button type="button" className="entry-replay" onClick={replay} disabled={!ready}><RotateCcw size={16} aria-hidden="true" />重播入场</button>
      </div>
    </header>
    <main className="app-shell player-theme-enabled theme-bright-school entry-review-stage">
      {!ready && <p className="entry-placeholder" role="status">正在准备部员立绘…</p>}
      {ready && !open && <button type="button" className="entry-open" onClick={replay}>打开部员手册</button>}
      {ready && open && <HouseModal key={run} user={user} characterListView={characters}
        audioSettings={audioSettings} musicTracks={musicTracks} onClose={() => setOpen(false)}
        onApplyDecoration={async () => {}} />}
    </main>
    <footer className="entry-review-note">
      <span className="entry-desktop-note">上下交替插入 · 轻微错峰 · 可悬停展开、点击详情</span>
      <span className="entry-mobile-note">手机端保留现有效果；桌面端可查看上下交错入场。</span>
      <span className="entry-timing">{slow ? "0.4× 慢放" : "约 0.7 秒完成"}</span>
    </footer>
  </div>;
}

createRoot(document.getElementById("root")).render(<Preview />);
