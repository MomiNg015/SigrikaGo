import { COLORS, GAME_PHASES } from "../src/shared/game.js";
import {
  onlineParticipantCount as defaultOnlineParticipantCount,
  watchPlayerSummary as defaultWatchPlayerSummary
} from "./roomPresence.js";

export function createRoomQueries({
  rooms,
  membershipIndex = null,
  onlineParticipantCount = defaultOnlineParticipantCount,
  watchPlayerSummary = defaultWatchPlayerSummary
}) {
  function listActiveRooms() {
    return [...rooms.values()].filter((room) => room.game.phase !== GAME_PHASES.finished);
  }

  function listWatchRooms() {
    return [...rooms.values()].map((room) => ({
      code: room.code,
      mode: room.mode ?? room.game.mode ?? "spark",
      onlineCount: onlineParticipantCount(room),
      moveNumber: room.game.moveNumber,
      status: room.game.phase === GAME_PHASES.finished ? "finished" : "playing",
      closesAt: room.closesAt ?? null,
      black: watchPlayerSummary(room, COLORS.black),
      white: watchPlayerSummary(room, COLORS.white)
    }));
  }

  function isUserInActiveRoom(userId) {
    if (membershipIndex?.isUserInActiveRoom) return membershipIndex.isUserInActiveRoom(userId);
    return listActiveRooms().some((room) => room.players.some((player) => player.user.id === userId));
  }

  function findRoomForUser(userId, roomCode = "") {
    if (membershipIndex?.findRoomForUser) return membershipIndex.findRoomForUser(userId, roomCode);
    const candidates = roomCode ? [rooms.get(roomCode)] : [...rooms.values()];
    return candidates.find((room) => room?.players.some((player) => player.user.id === userId && room.game.phase !== GAME_PHASES.finished))
      ?? candidates.find((room) => room?.players.some((player) => player.user.id === userId))
      ?? null;
  }

  return {
    listActiveRooms,
    listWatchRooms,
    isUserInActiveRoom,
    findRoomForUser
  };
}
