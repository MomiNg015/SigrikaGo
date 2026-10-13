import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, RefreshCw, Search, X } from "lucide-react";
import WindowTitleSticker from "../../../src/modals/WindowTitleSticker.jsx";
import WindowEmptyState from "../../../src/modals/WindowEmptyState.jsx";
import { ModalDialog } from "../../../src/modals/modalComponents.jsx";
import UserIdentity from "../../../src/shared/UserIdentity.jsx";
import { CHARACTERS } from "../../../src/shared/characters.js";
import { characterPortraitImageProps } from "../../../src/shared/characterPortraits.js";
import { gameModeById } from "../../../src/shared/gameModes.js";
import { rooms } from "./fixtures.js";
import "../../../src/styles.css";
import "./sample.css";

const requested = new URLSearchParams(location.search).get("view");
const view = ["split", "versus", "columns"].includes(requested) ? requested : "split";

function Player({ entry, side }) {
  const character = CHARACTERS[entry.characterId];
  return <div className={`mw-player ${side}${entry.connected ? "" : " offline"}`}>
    <span className="mw-side" aria-label={side === "black" ? "黑方" : "白方"}>{view === "columns" ? (side === "black" ? "黑" : "白") : (side === "black" ? "●" : "○")}</span>
    {view !== "columns" && <img {...characterPortraitImageProps(character, { variant: "avatar", user: entry.user })} alt={character.name}/>}
    <UserIdentity user={entry.user} compact/>
    {!entry.connected && <span className="mw-away">暂离</span>}
  </div>;
}

function Match({ room, selected, onSelect }) {
  return <article className={`mw-row ${room.status === "finished" ? "finished" : ""}`} aria-label={`房间 ${room.code}`} data-selected={selected}>
    <div className="mw-meta">
      <span className={`mw-type mode-${room.mode}`}>{gameModeById(room.mode).shortTitle}</span>
      <span className="mw-code"><span className="mw-room-label">房间 </span>{view === "columns" ? "#" : ""}{room.code}</span>
      <span className="mw-status">{room.status === "finished" ? "已结束" : "对局中"}</span>
    </div>
    <div className="mw-players"><Player entry={room.black} side="black"/>{view === "versus" && <span className="mw-vs" aria-hidden="true">VS</span>}<Player entry={room.white} side="white"/></div>
    <div className="mw-stats"><span className="mw-moves"><b>{room.moveNumber}</b> 手</span><span className="mw-people" title="房间人数"><b>{room.onlineCount}</b> 人</span></div>
    <button className="mw-watch" aria-label={`观战房间 ${room.code}`} aria-pressed={selected} onClick={() => onSelect(room.code)}>{selected ? "已选" : "观战"}<ArrowRight size={15} aria-hidden="true"/></button>
  </article>;
}

function Preview() {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const visible = rooms.filter(room => [room.code, room.black.user.username, room.white.user.username].some(text => text.includes(query.trim())));
  function refresh() { setSelected(""); setRefreshing(true); setTimeout(() => setRefreshing(false), 250); }
  return <div className="app-shell player-theme-enabled theme-bright-school mw-preview">
    {!open ? <button onClick={() => setOpen(true)}>打开观战窗口</button> : <div className="modal-backdrop mw-backdrop" onClick={() => setOpen(false)}>
      <ModalDialog className={`small-modal watch-list-modal window-sticker-host mw-window mw-${view}`} ariaLabelledBy="mw-title" onClose={() => setOpen(false)} onClick={event => event.stopPropagation()}>
        <header className="watch-list-header window-sticker-header"><WindowTitleSticker titleKey="watch" id="mw-title"/><div className="watch-list-actions"><button className="icon-button" aria-label="刷新对局列表" disabled={refreshing} onClick={refresh}><RefreshCw size={18}/></button><button className="close-button inline-close" aria-label="关闭对局列表" onClick={() => setOpen(false)}><X size={20}/></button></div></header>
        <div className="mw-toolbar"><label className="mw-search"><Search size={16}/><input aria-label="搜索房间或玩家" placeholder="房间号 / 玩家" value={query} onChange={event => setQuery(event.target.value)}/></label><span role="status">{refreshing ? "刷新中…" : `${visible.length} 场`}</span></div>
        <div className="mw-scroll" aria-busy={refreshing}>
          {view === "columns" && visible.length > 0 && <div className="mw-head" aria-hidden="true"><span>对局</span><span>玩家</span><span>进度</span></div>}
          {visible.length ? visible.map(room => <Match key={room.code} room={room} selected={selected === room.code} onSelect={setSelected}/>) : <WindowEmptyState>{query ? "未找到对局" : "暂无对局"}</WindowEmptyState>}
        </div>
      </ModalDialog>
    </div>}
  </div>;
}
createRoot(document.getElementById("root")).render(<Preview/>);
