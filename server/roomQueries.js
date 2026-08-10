import { COLORS, GAME_PHASES } from "../src/shared/game.js";
import { PRACTICE_MATCH_SOURCE } from "../src/shared/practiceMode.js";
import { SIGRIKA_CANDY_DUEL } from "../src/shared/sigrikaCandyArc.js";
import {
  onlineParticipantCount as defaultOnlineParticipantCount,
  watchPlayerSummary as defaultWatchPlayerSummary
} from "./roomPresence.js";

export function createRoomQueries({
  rooms,
  membershipIndex = null,
  roomReadModel = null,
  onlineParticipantCount = defaultOnlineParticipantCount,
  watchPlayerSummary = defaultWatchPlayerSummary
}) {
  function listActiveRooms() {
    if (roomReadModel?.listActiveRooms) return roomReadModel.listActiveRooms();
    return [...rooms.values()].filter((room) => room.game.phase !== GAME_PHASES.finished);
  }

  function listWatchRooms() {
    if (roomReadModel?.listWatchRooms) {
      return roomReadModel.listWatchRooms().filter((room) => room.matchSource !== PRACTICE_MATCH_SOURCE && room.matchSource !== SIGRIKA_CANDY_DUEL.matchSource);
    }
    return [...rooms.values()].filter((room) => room.matchSource !== PRACTICE_MATCH_SOURCE && room.matchSource !== SIGRIKA_CANDY_DUEL.matchSource).map((room) => ({
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

  function findActiveSigrikaCandyDuel() {
    return [...rooms.values()].find((room) => (
      room?.matchSource === SIGRIKA_CANDY_DUEL.matchSource
      && Boolean(room.sigrikaCandyDuel)
      && room.game?.phase !== GAME_PHASES.finished
    )) ?? null;
  }

  return {
    listActiveRooms,
    listWatchRooms,
    isUserInActiveRoom,
    findRoomForUser,
    findActiveSigrikaCandyDuel
  };
}
