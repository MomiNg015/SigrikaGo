import { GAME_PHASES } from "../src/shared/game.js";

export const ROOM_CLOSE_DELAY_MS = 5 * 60 * 1000;
export const INVALID_ROOM_CLOSE_DELAY_MS = 30 * 1000;
export const EMPTY_ACTIVE_ROOM_CLOSE_MS = 5 * 60 * 1000;

export function roomCloseDelay(room) {
  return room?.game?.winner?.invalid ? INVALID_ROOM_CLOSE_DELAY_MS : ROOM_CLOSE_DELAY_MS;
}

export function createRoomCloseLifecycle({
  rooms,
  clearRoomTimers,
  scheduleRoomTimeout,
  clearRoomTimeout,
  hasConnectedRoomParticipant,
  arePlayersDisconnected,
  emitRoomClosed,
  deletePersistedRoom,
  persistRoom,
  appendSystem,
  saveGameRecord,
  prepareCloseState = () => {},
  onSaveError = (error) => console.error("Failed to save game record", error),
  onDeleteError = (error) => console.error("Failed to delete persisted room", error),
  now = () => Date.now()
}) {
  function scheduleRoomClose(roomCode, io) {
    const room = rooms.get(roomCode);
    if (!room) return;
    if (!room.recordSaved) {
      prepareCloseState(room);
      Promise.resolve(saveGameRecord(room)).catch(onSaveError);
    }
    const closeDelay = roomCloseDelay(room);
    const nextClosesAt = now() + closeDelay;
    if (!room.closesAt || (room.game.winner?.invalid && room.closesAt > nextClosesAt)) {
      room.closesAt = nextClosesAt;
    }
    persistRoom(room, { force: true });
    scheduleRoomTimeout(room, () => {
      const latest = rooms.get(roomCode);
      if (!latest) return;
      if (!latest.game.winner?.invalid && hasConnectedRoomParticipant(latest)) {
        latest.closesAt = now() + roomCloseDelay(latest);
        persistRoom(latest, { force: true });
        scheduleRoomClose(roomCode, io);
        return;
      }
      closeRoom(roomCode, io, { reason: "finished-room-close" });
    }, Math.max(0, room.closesAt - now()));
  }

  function closeRoom(roomCode, io, { message = "", reason = "" } = {}) {
    const room = rooms.get(roomCode);
    if (!room) return;
    clearRoomTimers(room);
    const payload = {
      ...(message ? { message } : {}),
      ...(reason ? { reason } : {}),
      roomCode
    };
    emitRoomClosed(io, room, payload);
    rooms.delete(roomCode);
    Promise.resolve(deletePersistedRoom(roomCode)).catch(onDeleteError);
  }

  function scheduleEmptyActiveRoomClose(room, io) {
    if (!room || room.game.phase === GAME_PHASES.finished) return;
    if (!arePlayersDisconnected(room)) {
      clearEmptyRoomClose(room);
      return;
    }
    room.emptySince ??= now();
    if (room.emptyTimerId) return;
    const delay = Math.max(0, room.emptySince + EMPTY_ACTIVE_ROOM_CLOSE_MS - now());
    room.emptyTimerId = scheduleRoomTimeout(room, () => {
      room.emptyTimerId = null;
      const latest = rooms.get(room.code);
      if (!latest || latest.game.phase === GAME_PHASES.finished || !arePlayersDisconnected(latest)) return;
      latest.game.phase = GAME_PHASES.finished;
      latest.game.winner = {
        winnerColor: null,
        reason: "empty-room",
        text: "对局无效",
        invalid: true,
        invalidReason: "empty-room"
      };
      latest.recordSaved = true;
      appendSystem(latest, "双方离开房间超过5分钟，对局无效。");
      persistRoom(latest, { force: true });
      closeRoom(latest.code, io);
    }, delay);
    persistRoom(room, { force: true });
  }

  function clearEmptyRoomClose(room) {
    room.emptySince = null;
    if (room.emptyTimerId) {
      clearRoomTimeout(room, room.emptyTimerId);
      room.emptyTimerId = null;
    }
  }

  return {
    scheduleRoomClose,
    closeRoom,
    scheduleEmptyActiveRoomClose,
    clearEmptyRoomClose
  };
}
