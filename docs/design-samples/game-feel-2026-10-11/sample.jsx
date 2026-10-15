/* Isolated visual exploration: current campus assets, local fixture state, no API calls. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Monitor, Smartphone, RotateCcw, ArrowLeft } from "lucide-react";
import AudioStation from "./AudioStation.jsx";
import ItemKit from "./ItemKit.jsx";
import ContactBook from "./ContactBook.jsx";
import "./shell.css";
import "./audio.css";
import "./items.css";
import "./friends.css";

const views = [ ["audio", "设置", "社团音响台"], ["items", "仓库", "随身道具箱"], ["friends", "好友", "部员联络册"] ];
const params = new URLSearchParams(location.search);
const initialView = views.some(([id]) => id === params.get("view")) ? params.get("view") : "audio";
const isEmbedded = params.has("embed");

function Sample() {
  const [view, setView] = useState(initialView);
  const [phone, setPhone] = useState(false);
  const [revision, setRevision] = useState(0);
  const [closed, setClosed] = useState(false);
  const title = views.find(([id]) => id === view)[2];
  const choose = (next) => { setView(next); setClosed(false); };
  return <div className={`sample-app ${isEmbedded ? "embedded" : ""}`}>
    {!isEmbedded && <header className="sample-toolbar">
      <div className="sample-brand"><b>校园物件</b><span>交互样板 · 仅本地演示</span></div>
      <nav aria-label="样板切换">{views.map(([id, label]) => <button key={id} aria-pressed={view === id} onClick={() => choose(id)}>{label}</button>)}</nav>
      <div className="sample-tools"><button title="桌面预览" aria-label="桌面预览" aria-pressed={!phone} onClick={() => setPhone(false)}><Monitor size={18}/></button><button title="手机预览" aria-label="手机预览" aria-pressed={phone} onClick={() => setPhone(true)}><Smartphone size={18}/></button><button title="重置样板" aria-label="重置样板" onClick={() => { setRevision(revision + 1); setClosed(false); }}><RotateCcw size={17}/></button></div>
    </header>}
    {phone && !isEmbedded ? <main className="phone-preview"><iframe key={`${view}-${revision}`} title={`${title}手机预览`} src={`?embed&view=${view}`} /></main> : <main className="campus-stage">
      {closed ? <button className="reopen game-button" onClick={() => setClosed(false)}>重新打开{title}</button> : <section className={`game-window window-${view}`} aria-label={title}>
        <header className="game-heading"><div><span className="paper-index">星炬学院围棋部</span><h1>{title}</h1></div><button className="back-button" aria-label="收起窗口" onClick={() => setClosed(true)}><ArrowLeft size={21}/><span>返回</span></button></header>
        <div key={`${view}-${revision}`} className="game-content">
          {view === "audio" ? <AudioStation/> : view === "items" ? <ItemKit/> : <ContactBook/>}
        </div>
      </section>}
    </main>}
  </div>;
}
createRoot(document.getElementById("root")).render(<Sample/>);
