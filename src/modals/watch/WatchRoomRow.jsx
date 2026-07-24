import { findCharacter } from "../../shared/characterDisplay.js";
import { resolveCharacterPortrait } from "../../shared/characterPortraits.js";
import UserIdentity from "../../shared/UserIdentity.jsx";

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
      <span className="watch-online-cell">{room.onlineCount}</span>
      <WatchPlayerCell player={room.black} characters={characters} side="black" />
      <WatchPlayerCell player={room.white} characters={characters} side="white" />
      <span className="watch-move-cell">{room.moveNumber}</span>
      <span className={`watch-status ${room.status}`}>{statusTextForWatchRoom(room)}</span>
    </button>
  );
}

function WatchPlayerCell({ player, characters, side }) {
  if (!player) return <span className={`watch-player-cell empty ${side}`}>-</span>;
  const character = findCharacter(characters, player.character ?? player.characterId);
  return (
    <span className={`watch-player-cell ${side} ${player.connected ? "" : "disconnected"}`}>
      <span className="watch-side-label">{side === "black" ? "●" : "○"}</span>
      <img src={resolveCharacterPortrait(character, { itemEffects: player.user?.itemEffects, user: player.user, costumeSnapshot: player.costumeSnapshot })} alt={character.name} />
      <UserIdentity user={player.user} compact />
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
