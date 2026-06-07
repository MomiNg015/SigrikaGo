import { findCharacter } from "../../shared/characterDisplay.js";
import { resolveCandyPortrait } from "../../shared/candyPortraits.js";

export default function WatchRoomRow({ room, characters, onJoinRoom, onClose }) {
  return (
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
