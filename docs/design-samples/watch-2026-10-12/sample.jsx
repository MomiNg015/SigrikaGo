import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, Check, Eye, RefreshCw, Search, X } from "lucide-react";
import WatchModal from "../../../src/modals/WatchModal.jsx";
import WindowTitleSticker from "../../../src/modals/WindowTitleSticker.jsx";
import WindowEmptyState from "../../../src/modals/WindowEmptyState.jsx";
import { ModalDialog } from "../../../src/modals/modalComponents.jsx";
import UserIdentity from "../../../src/shared/UserIdentity.jsx";
import { CHARACTERS } from "../../../src/shared/characters.js";
import { characterPortraitImageProps } from "../../../src/shared/characterPortraits.js";
import { gameModeById } from "../../../src/shared/gameModes.js";
import { statusTextForWatchRoom } from "../../../src/modals/watch/WatchRoomRow.jsx";
import "../../../src/styles.css";
import "./sample.css";

const params = new URLSearchParams(location.search);
const view = ["ledger", "duel", "ticket", "current"].includes(params.get("view")) ? params.get("view") : "ledger";
const player = (username, characterId, connected = true) => ({ user: { username, itemEffects: {} }, characterId, connected });
const fixtures = [
  { code: "483126", mode: "spark", black: player("今天也要吃橘子", "sigrika"), white: player("雨天的棉花糖", "denia"), moveNumber: 86, onlineCount: 12, status: "playing" },
  { code: "902417", mode: "standard", black: player("白昼漫游", "aemeath"), white: player("窗边的风", "lynae"), moveNumber: 124, onlineCount: 6, status: "playing" },
  { code: "615803", mode: "gomoku", black: player("薄荷汽水", "mornye"), white: player("星星不打烊", "chisa"), moveNumber: 23, onlineCount: 4, status: "playing" },
  { code: "270954", mode: "team", black: player("放学后的棋社", "qiuyuan"), white: player("晚风与纸飞机", "aemeath"), moveNumber: 57, onlineCount: 8, status: "playing" },
  { code: "318602", mode: "spark", black: player("想再下一盘", "lynae"), white: player("猫猫睡着了", "denia", false), moveNumber: 142, onlineCount: 3, status: "playing" },
  { code: "750129", mode: "standard", black: player("晨光收藏家", "sigrika"), white: player("月亮的留言", "mornye"), moveNumber: 211, onlineCount: 5, status: "finished" },
  { code: "146935", mode: "gomoku", black: player("周末有空吗", "chisa"), white: player("小小胜负师", "qiuyuan"), moveNumber: 31, onlineCount: 2, status: "finished" }
];
let rooms = params.has("empty") ? [] : params.has("many") ? Array.from({ length: 30 }, (_, index) => ({ ...fixtures[index % fixtures.length], code: String(100001 + index) })) : fixtures;
if (params.has("long")) rooms = rooms.map(room => ({ ...room, black: { ...room.black, user: { ...room.black.user, username: "每天放学以后都想和大家再下一盘棋" } }, moveNumber: 1024, onlineCount: 128 }));
const nativeFetch = window.fetch;
window.fetch = async (url, options) => {
  if (typeof url !== "string" || !url.startsWith("/api/")) return nativeFetch(url, options);
  if (!url.startsWith("/api/rooms/watch?") || options?.headers?.Authorization !== "Bearer watch-design-preview") throw new Error("This preview does not access account APIs");
  const mode = new URL(url, location.origin).searchParams.get("mode");
  return Response.json({ rooms: rooms.filter(room => mode === "all" || room.mode === mode) });
};

function Player({ entry, side }) {
  if (!entry) return <span className="wp-player">—</span>;
  const character = CHARACTERS[entry.characterId];
  return <span className={`wp-player ${side}${entry.connected ? "" : " offline"}`} title={`${side === "black" ? "黑" : "白"}方 · ${entry.user.username}${entry.connected ? "" : " · 暂离"}`}>
    <span className="wp-stone" aria-label={side === "black" ? "黑方" : "白方"}/>
    <img {...characterPortraitImageProps(character, { variant: "avatar", user: entry.user })} alt={character.name} />
    <UserIdentity user={entry.user} compact />
    {!entry.connected && <span className="wp-offline">暂离</span>}
  </span>;
}

function RoomRow({ room, selected, onSelect }) {
  const title = gameModeById(room.mode).shortTitle;
  return <tr className={`wp-row ${room.status === "finished" ? "finished" : ""}`} data-selected={selected}>
    <td className="wp-code" data-label="房间"><span>{room.code}</span></td>
    <td className={`wp-mode mode-${room.mode}`} data-label="类型"><span>{title}</span></td>
    {view === "ledger" ? <><td className="wp-black"><Player entry={room.black} side="black"/></td><td className="wp-white"><Player entry={room.white} side="white"/></td></> : <td className="wp-matchup"><Player entry={room.black} side="black"/>{view === "duel" && <span className="wp-vs" aria-hidden="true">VS</span>}<Player entry={room.white} side="white"/></td>}
    <td className="wp-moves" data-label="手数"><b>{room.moveNumber}</b><span className="wp-unit">手</span></td>
    <td className="wp-people" data-label="房间人数"><span>{room.onlineCount}</span><span className="wp-unit">人</span></td>
    <td className="wp-status"><span>{statusTextForWatchRoom(room)}</span></td>
    <td className="wp-action"><button type="button" aria-label={`观战房间 ${room.code}`} aria-pressed={selected} onClick={() => onSelect(room.code)}>{selected ? <Check size={17}/> : view === "ledger" ? <ArrowRight size={18}/> : <Eye size={17}/>}<span>{selected ? "已选" : "观战"}</span></button></td>
  </tr>;
}

function Preview() {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const visible = rooms.filter(room => [room.code, room.black.user.username, room.white.user.username].some(text => text.toLowerCase().includes(query.trim().toLowerCase())));
  function refresh() { setRefreshing(true); setSelected(""); window.setTimeout(() => setRefreshing(false), 350); }
  return <div className="app-shell player-theme-enabled theme-bright-school wp-preview">
    {!open ? <button className="wp-reopen" onClick={() => setOpen(true)}>打开观战窗口</button> : (view === "current" || view === "ledger") ? <WatchModal token="watch-design-preview" characters={CHARACTERS} onJoinRoom={setSelected} onClose={() => setOpen(false)}/> :
      <div className="modal-backdrop wp-backdrop" onClick={() => setOpen(false)}>
        <ModalDialog className={`small-modal watch-list-modal window-sticker-host watch-prototype wp-${view}`} ariaLabelledBy="watch-sample-title" onClose={() => setOpen(false)} onClick={event => event.stopPropagation()}>
          <header className="watch-list-header window-sticker-header"><WindowTitleSticker titleKey="watch" id="watch-sample-title"/><div className="watch-list-actions"><button className="icon-button" type="button" aria-label="刷新对局列表" disabled={refreshing} onClick={refresh}><RefreshCw size={18}/></button><button className="close-button inline-close" type="button" aria-label="关闭对局列表" onClick={() => setOpen(false)}><X size={20}/></button></div></header>
          <div className="wp-toolbar"><label className="wp-search"><Search size={17} aria-hidden="true"/><input aria-label="搜索房间或玩家" placeholder="房间号 / 玩家名称" value={query} onChange={event => setQuery(event.target.value)}/></label><span className="wp-total" role="status">{refreshing ? "刷新中…" : `${visible.length} 场对局`}</span></div>
          <div className="wp-scroll" aria-busy={refreshing}>
            {visible.length ? <table className="wp-table" aria-label="全部类型对局"><thead><tr><th>房间</th><th>类型</th>{view === "ledger" ? <><th>黑方</th><th>白方</th></> : <th>对阵</th>}<th>手数</th><th>人数</th><th>状态</th><th><span className="wp-sr-only">操作</span></th></tr></thead><tbody>{visible.map(room => <RoomRow key={room.code} room={room} selected={selected === room.code} onSelect={setSelected}/>)}</tbody></table> : <WindowEmptyState>{query ? "未找到对局" : "暂无对局"}</WindowEmptyState>}
          </div>
        </ModalDialog>
      </div>}
  </div>;
}
createRoot(document.getElementById("root")).render(<Preview/>);
