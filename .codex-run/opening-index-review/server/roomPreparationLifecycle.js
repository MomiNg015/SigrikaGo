import { GAME_PHASES } from "../src/shared/game.js";
import { MATCH_PRELOAD_TIMEOUT_MS, OPENING_NOTICE_DELAY_MS } from "./roomFactory.js";
import { roomParticipants } from "./roomPresence.js";

export const MATCH_PRELOAD_TIMEOUT_MESSAGE = "一方加载超时，匹配中止";

export function createRoomPreparationLifecycle({
  rooms,
  clearRoomTimers,
  deletePersistedRoom = async () => {},
  unregisterRoom = () => {},
  scheduleRoomTimeout,
  appendSystem,
  broadcastRoom,
  scheduleGameStart,
  metrics = null,
  now = () => Date.now()
}) {
  function scheduleRoomPreloadTimeout(room, io) {
    const deadlineAt = room.preload?.deadlineAt ?? now();
    scheduleRoomTimeout(room, () => {
      const latest = rooms.get(room.code);
      if (!latest || latest.game.phase !== GAME_PHASES.preloading) return;
      if (preloadReadyCount(latest) >= preloadRequiredCount(latest)) return;
      abortRoomPreload(latest, io);
    }, Math.max(0, deadlineAt - now()));
  }

  function markRoomPreloadReady(roomCode, userId, io) {
    const room = rooms.get(roomCode);
    if (!room || room.game.phase !== GAME_PHASES.preloading) return null;
    if (!room.players.some((player) => player.user.id === userId)) return null;

    room.preload ??= createPreloadState(room, now());
    const readyUserIds = new Set(room.preload.readyUserIds ?? []);
    readyUserIds.add(userId);
    room.preload.readyUserIds = [...readyUserIds];
    room.preload.readyCount = preloadReadyCount(room);
    room.preload.requiredCount = preloadRequiredCount(room);

    if (room.preload.readyCount >= room.preload.requiredCount) {
      startPreparedRoom(room, io);
      return room;
    }

    broadcastRoom(io, room);
    return room;
  }

  function startPreparedRoom(room, io) {
    if (room.game.phase !== GAME_PHASES.preloading) return false;
    room.game.phase = GAME_PHASES.opening;
    room.preload = {
      ...createPreloadState(room, room.preload?.startedAt ?? now()),
      ...room.preload,
      readyCount: preloadRequiredCount(room),
      requiredCount: preloadRequiredCount(room),
      completedAt: now()
    };
    room.openingEndsAt = now() + OPENING_NOTICE_DELAY_MS;
    appendSystem(room, "双方资源加载完成，准备进入对局。", { kind: "match-preload-complete" });
    broadcastRoom(io, room);
    scheduleGameStart(room, io);
    return true;
  }

  function abortRoomPreload(room, io) {
    metrics?.increment?.("matchPreloadTimeouts");
    emitMatchPreloadTimeout(io, room);
    clearRoomTimers(room);
    rooms.delete(room.code);
    unregisterRoom(room.code);
    void deletePersistedRoom(room.code);
    return true;
  }

  return {
    abortRoomPreload,
    markRoomPreloadReady,
    scheduleRoomPreloadTimeout,
    startPreparedRoom
  };
}

function createPreloadState(room, startedAt) {
  return {
    startedAt,
    deadlineAt: startedAt + MATCH_PRELOAD_TIMEOUT_MS,
    readyUserIds: [],
    readyCount: 0,
    requiredCount: preloadRequiredCount(room)
  };
}

function preloadReadyCount(room) {
  return (room.preload?.readyUserIds ?? [])
    .filter((userId) => room.players.some((player) => player.user.id === userId))
    .length;
}

function preloadRequiredCount(room) {
  return Math.max(1, room.players.length);
}

function emitMatchPreloadTimeout(io, room) {
  for (const participant of roomParticipants(room)) {
    if (participant.socketId) {
      io.to(participant.socketId).emit("match:preload-timeout", {
        roomCode: room.code,
        message: MATCH_PRELOAD_TIMEOUT_MESSAGE
      });
    }
  }
}
