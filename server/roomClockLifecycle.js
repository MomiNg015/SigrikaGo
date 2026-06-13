import {
  GAME_PHASES,
  INVALID_EARLY_RESIGN_NOTICE,
  createTimeoutResult,
  resultWithInvalidFlagForGame
} from "../src/shared/game.js";
import { tickPlayerClock } from "./roomClockTiming.js";

export function createRoomClockLifecycle({
  rooms,
  scheduleRoomInterval,
  clearRoomInterval,
  arePlayersDisconnected,
  scheduleEmptyActiveRoomClose,
  broadcastRoomClock,
  broadcastRoom,
  broadcastToast,
  appendSystem,
  scheduleRoomClose
}) {
  function startGameClock(room, io) {
    room.lastTick = Date.now();
    scheduleRoomInterval(room, () => {
      if (!rooms.has(room.code)) {
        clearRoomInterval(room);
        return;
      }
      if (room.game.phase !== GAME_PHASES.playing) {
        room.lastTick = Date.now();
        return;
      }
      if (arePlayersDisconnected(room)) {
        room.lastTick = Date.now();
        scheduleEmptyActiveRoomClose(room, io);
        return;
      }
      const now = Date.now();
      const elapsed = Math.max(1, Math.floor((now - room.lastTick) / 1000));
      if (elapsed <= 0) return;
      room.lastTick = now;
      const active = room.players.find((player) => player.color === room.game.turn);
      if (!active) return;
      tickPlayerClock(active, elapsed);
      if (active.time.main <= 0 && active.time.periods <= 0) {
        room.game.phase = GAME_PHASES.finished;
        room.game.winner = resultWithInvalidFlagForGame(room.game, createTimeoutResult(active.color));
        if (room.game.winner?.invalid) broadcastToast(io, room, INVALID_EARLY_RESIGN_NOTICE);
        appendSystem(room, `${active.user.username}超时，对局结束。`);
        scheduleRoomClose(room.code, io);
        broadcastRoom(io, room);
        return;
      }
      broadcastRoomClock(io, room);
    }, 1000);
  }

  return {
    startGameClock
  };
}
