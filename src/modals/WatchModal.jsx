import { RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { findCharacter } from "../shared/characterDisplay.js";
import { resolveCandyPortrait } from "../shared/candyPortraits.js";

export default function WatchModal({ token, characters, onJoinRoom, onNotice, onClose }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadRooms() {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/rooms/watch", { token });
      setRooms(data.rooms ?? []);
    } catch (loadError) {
      const message = loadError.message || "观战列表加载失败";
      setError(message);
      onNotice?.(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRooms();
  }, [token]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="small-modal watch-list-modal" onClick={(event) => event.stopPropagation()}>
        <div className="watch-list-header">
          <h2>对局列表</h2>
          <div className="watch-list-actions">
            <button className="icon-button" type="button" title="刷新列表" onClick={loadRooms} disabled={loading}>
              <RefreshCw size={18} />
            </button>
            <button className="close-button inline-close" type="button" onClick={onClose} title="关闭">
              <X size={20} />
            </button>
          </div>
        </div>
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
            <button
              className="watch-room-row"
              key={watchRoomRowKey(room)}
              type="button"
              role="row"
              onClick={() => joinWatchRoomFromList(room, { emitJoin: onJoinRoom, onClose })}
            >
              <span className="watch-code-cell">{room.code}</span>
              <span>{room.onlineCount}</span>
              <WatchPlayerCell player={room.black} characters={characters} />
              <WatchPlayerCell player={room.white} characters={characters} />
              <span>{room.moveNumber}</span>
              <span className={`watch-status ${room.status}`}>{statusTextForWatchRoom(room)}</span>
            </button>
          ))}
        </div>
        {!loading && rooms.length === 0 && <p className="watch-empty">当前没有可观战房间</p>}
        {loading && <p className="watch-empty">加载中...</p>}
        {error && <p className="watch-error">{error}</p>}
      </section>
    </div>
  );
}

function WatchPlayerCell({ player, characters }) {
  if (!player) return <span className="watch-player-cell empty">-</span>;
  const character = findCharacter(characters, player.character ?? player.characterId);
  return (
    <span className={`watch-player-cell ${player.connected ? "" : "disconnected"}`}>
      <img src={resolveCandyPortrait(character, player.user?.itemEffects)} alt={character.name} />
      <span>{player.user?.username ?? "-"}</span>
    </span>
  );
}

export function statusTextForWatchRoom(room) {
  return room?.status === "finished" ? "已结束" : "对局中";
}

export function watchRoomRowKey(room) {
  return String(room?.code ?? "");
}

export function joinWatchRoomFromList(room, { emitJoin, onClose } = {}) {
  if (!room?.code) return false;
  emitJoin?.(room.code);
  onClose?.();
  return true;
}
