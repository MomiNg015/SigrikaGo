import { ArrowRight } from "lucide-react";
import { gameModeById } from "../../shared/gameModes.js";
import { findCharacter } from "../../shared/characterDisplay.js";
import { characterPortraitImageProps } from "../../shared/characterPortraits.js";
import UserIdentity from "../../shared/UserIdentity.jsx";

export default function WatchRoomRow({ room, characters, onJoinRoom, onClose }) {
  const mode = gameModeById(room.mode);
  return <tr className={`wl-row ${room.status === "finished" ? "finished" : ""}`}>
    <td className="wl-code">{room.code}</td>
    <td className={`wl-mode mode-${mode.id}`}><span>{mode.shortTitle}</span></td>
    <td className="wl-black"><WatchPlayerCell player={room.black} characters={characters} side="black"/></td>
    <td className="wl-white"><WatchPlayerCell player={room.white} characters={characters} side="white"/></td>
    <td className="wl-moves"><b>{room.moveNumber}</b><span className="wl-unit">手</span></td>
    <td className="wl-people" title="房间人数">{room.onlineCount}<span className="wl-unit">人</span></td>
    <td className="wl-status"><span>{statusTextForWatchRoom(room)}</span></td>
    <td className="wl-action"><button type="button" aria-label={`观战房间 ${room.code}`} onClick={() => joinWatchRoomFromList(room, { emitJoin: onJoinRoom, onClose })}><ArrowRight size={18} aria-hidden="true"/><span>观战</span></button></td>
  </tr>;
}

function WatchPlayerCell({ player, characters, side }) {
  if (!player) return <span className={`wl-player ${side}`}>—</span>;
  const character = findCharacter(characters, player.character ?? player.characterId);
  return <span className={`wl-player ${side}${player.connected ? "" : " offline"}`} title={`${side === "black" ? "黑" : "白"}方 · ${player.user?.username ?? ""}${player.connected ? "" : " · 暂离"}`}>
    <span className="wl-stone" aria-label={side === "black" ? "黑方" : "白方"}/>
    <img {...characterPortraitImageProps(character, { variant: "avatar", itemEffects: player.user?.itemEffects, user: player.user, costumeSnapshot: player.costumeSnapshot })} alt={character.name}/>
    <UserIdentity user={player.user} compact />
  </span>;
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
