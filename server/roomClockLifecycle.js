import {
  GAME_PHASES,
  INVALID_EARLY_RESIGN_NOTICE,
  createTimeoutResult,
  resultWithInvalidFlagForGame
} from "../src/shared/game.js";
import { tickPlayerClock } from "./roomClockTiming.js";
import { isLocalPractice, LOCAL_PRACTICE_PRESENCE_MS, LOCAL_PRACTICE_IDLE_MS } from "../src/shared/localPractice.js";

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
    if (isLocalPractice(room)) room.localPracticeSeenAt ??= room.lastTick;
    if (room.unlimitedTime) return;
    scheduleRoomInterval(room, () => syncGameClock(room, io), 1000);
  }

  function syncGameClock(room, io) {
    if (room.unlimitedTime) { room.lastTick = Date.now(); return; }
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
    if (isLocalPractice(room)) {
      const idleMs = now - (room.localPracticePausedAt ?? room.localPracticeSeenAt ?? room.createdAt ?? now);
      if (idleMs >= LOCAL_PRACTICE_IDLE_MS) {
        room.game.phase = GAME_PHASES.finished;
        room.game.winner = { winnerColor: null, reason: "practice-device-unavailable", text: "本机陪练长时间未恢复，本局已结束。" };
        scheduleRoomClose(room.code, io);
        broadcastRoom(io, room);
        return;
      }
      if (room.localPracticePausedAt != null || idleMs >= LOCAL_PRACTICE_PRESENCE_MS || room.game.turn === room.practice.botColor) {
        room.lastTick = now;
        return;
      }
    }
    const active = room.players.find((player) => player.color === room.game.turn);
    const elapsedMs = Math.max(0, now - room.lastTick);
    room.lastTick = now;
    if (!active || active.time?.unlimited) return;
    const totalMs = Number(active.clockRemainderMs ?? 0) + elapsedMs;
    const elapsed = Math.floor(totalMs / 1000);
    active.clockRemainderMs = totalMs % 1000;
    if (elapsed <= 0) return;
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
  }

  return { startGameClock, syncGameClock };
}
