import { RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client.js";
import { modeOrderedEntries } from "../shared/gameModes.js";
import WatchRoomRow, {
  joinWatchRoomFromList,
  statusTextForWatchRoom,
  watchRoomRowKey
} from "./watch/WatchRoomRow.jsx";
import { ModalDialog } from "./modalComponents.jsx";

export default function WatchModal({ token, characters, onJoinRoom, onNotice, onClose }) {
  const [mode, setMode] = useState("spark");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRooms = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await api(`/api/rooms/watch?mode=${encodeURIComponent(mode)}`, { token });
      setRooms(data.rooms ?? []);
    } catch (loadError) {
      const message = loadError.message || "观战列表加载失败";
      setError(message);
      onNotice?.(message);
    } finally {
      setLoading(false);
    }
  }, [mode, onNotice, token]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <ModalDialog className="small-modal watch-list-modal" ariaLabelledBy="watch-modal-title" onClose={onClose} onClick={(event) => event.stopPropagation()}>
        <div className="watch-list-header">
          <h2 id="watch-modal-title">对局列表</h2>
          <div className="watch-list-actions">
            <button className="icon-button" type="button" title="刷新列表" aria-label="刷新对局列表" onClick={loadRooms} disabled={loading}>
              <RefreshCw size={18} />
            </button>
            <button className="close-button inline-close" type="button" onClick={onClose} title="关闭" aria-label="关闭对局列表">
              <X size={20} />
            </button>
          </div>
        </div>
        <ModeTabs mode={mode} onModeChange={setMode} />
        <div className="watch-room-table" role="table">
          <div className="watch-room-head" role="row">
            <span>房间号</span>
            <span>房间人数</span>
            <span>黑方</span>
            <span>白方</span>
            <span>手数</span>
            <span>状态</span>
          </div>
          {rooms.map((room) => (
            <WatchRoomRow
              key={watchRoomRowKey(room)}
              room={room}
              characters={characters}
              onJoinRoom={onJoinRoom}
              onClose={onClose}
            />
          ))}
        </div>
        {!loading && rooms.length === 0 && <p className="watch-empty">当前没有可观战房间</p>}
        {loading && <p className="watch-empty">加载中...</p>}
        {error && <p className="watch-error">{error}</p>}
      </ModalDialog>
    </div>
  );
}

export { joinWatchRoomFromList, statusTextForWatchRoom, watchRoomRowKey };

function ModeTabs({ mode, onModeChange }) {
  return (
    <div className="mode-tabs" role="tablist" aria-label="对弈模式">
      {modeOrderedEntries().map((entry) => (
        <button
          key={entry.id}
          type="button"
          role="tab"
          aria-selected={mode === entry.id}
          className={mode === entry.id ? "active" : ""}
          onClick={() => onModeChange(entry.id)}
        >
          {entry.shortTitle}
        </button>
      ))}
    </div>
  );
}
