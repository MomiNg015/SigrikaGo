import WindowLoadingState from "./WindowLoadingState.jsx";
import WindowEmptyState from "./WindowEmptyState.jsx";
import WindowTitleSticker from "./WindowTitleSticker.jsx";
import { RefreshCw, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";
import WatchRoomRow, {
  joinWatchRoomFromList,
  statusTextForWatchRoom,
  watchRoomRowKey
} from "./watch/WatchRoomRow.jsx";
import { ModalDialog } from "./modalComponents.jsx";

export default function WatchModal({ token, characters, onJoinRoom, onNotice, onClose }) {
  const [query, setQuery] = useState("");
  const requestId = useRef(0);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");

  const loadRooms = useCallback(async () => {
    if (!token) return;
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/rooms/watch?mode=all", { token });
      if (id !== requestId.current) return;
      const nextRooms = data.rooms ?? [];
      setRooms(nextRooms);
    } catch (loadError) {
      if (id !== requestId.current) return;
      const message = loadError.message || "观战列表加载失败";
      setError(message);
      onNotice?.(message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [onNotice, token]);

  useEffect(() => {
    loadRooms();
    return () => { requestId.current += 1; };
  }, [loadRooms]);

  const search = query.trim().toLowerCase();
  const visibleRooms = rooms.filter((room) => [room.code, room.black?.user?.username, room.white?.user?.username].some((value) => String(value ?? "").toLowerCase().includes(search)));

  return (
    <div className="modal-backdrop wl-backdrop" onClick={onClose}>
      <ModalDialog className="small-modal watch-list-modal window-sticker-host watch-ledger wl-ledger" ariaLabelledBy="watch-modal-title" onClose={onClose} onClick={(event) => event.stopPropagation()}>
        <div className="watch-list-header window-sticker-header">
          <WindowTitleSticker titleKey="watch" id="watch-modal-title" />
          <div className="watch-list-actions">
            <button className="icon-button" type="button" title="刷新列表" aria-label="刷新对局列表" onClick={loadRooms} disabled={loading}>
              <RefreshCw size={18} />
            </button>
            <button className="close-button inline-close" type="button" onClick={onClose} title="关闭" aria-label="关闭对局列表">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="wl-toolbar">
          <label className="wl-search"><Search size={17} aria-hidden="true"/><input aria-label="搜索房间或玩家" placeholder="房间号 / 玩家名称" value={query} onChange={(event) => setQuery(event.target.value)}/></label>
          <span className="wl-total" role="status">{loading ? "刷新中…" : error ? "加载失败" : `${visibleRooms.length} 场对局`}</span>
        </div>
        <div className="wl-scroll" aria-busy={loading}>
          {visibleRooms.length > 0 && <table className="wl-table" aria-label="全部类型对局">
            <thead><tr><th scope="col">房间</th><th scope="col">类型</th><th scope="col" title="房间人数">人数</th><th scope="col">黑方</th><th scope="col">白方</th><th scope="col">手数</th><th scope="col">状态</th><th scope="col" className="wl-sr-only">进入观战</th></tr></thead>
            <tbody>{visibleRooms.map((room) => <WatchRoomRow key={watchRoomRowKey(room)} room={room} characters={characters} onJoinRoom={onJoinRoom} onClose={onClose}/>)}</tbody>
          </table>}
          {!loading && !error && visibleRooms.length === 0 && <WindowEmptyState>{search ? "未找到对局" : "暂无对局"}</WindowEmptyState>}
          {loading && rooms.length === 0 && <WindowLoadingState>加载中...</WindowLoadingState>}
          {error && <p className="watch-error" role="alert">{error}</p>}
        </div>
      </ModalDialog>
    </div>
  );
}

export { joinWatchRoomFromList, statusTextForWatchRoom, watchRoomRowKey };
