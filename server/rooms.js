import {
  COLORS,
  GAME_PHASES
} from "../src/shared/game.js";
import { prisma } from "./db.js";
import { resetByoYomi } from "./roomClockTiming.js";
import { prepareCandyEffectUpdates } from "./roomItemEffects.js";
import { listPersistedRooms, deletePersistedRoom as deletePersistedRoomState } from "./roomPersistence.js";
import { hydratePersistedRoom, persistRoomState } from "./roomStatePersistence.js";
import {
  broadcastRoom as broadcastRoomUpdate,
  broadcastRoomClock,
  broadcastToast as broadcastRoomToast,
  emitRoomClosed,
  roomView
} from "./roomBroadcasts.js";
import {
  clearRoomInterval,
  clearRoomTimers,
  clearRoomTimeout,
  scheduleRoomInterval,
  scheduleRoomTimeout
} from "./roomTimers.js";
import {
  arePlayersDisconnected,
  hasConnectedRoomParticipant,
  onlineParticipantCount,
  watchPlayerSummary
} from "./roomPresence.js";
import { createRoomMatchmakingQueue } from "./roomMatchmakingQueue.js";
import {
  createRoomSkillLifecycle
} from "./roomSkillResolution.js";
import {
  appendNotices,
  appendSystem,
  ensureRestoredDisconnectedNotices
} from "./roomSystemMessages.js";
import { validateActionPoint } from "./roomActionValidation.js";
import { createRoomCloseLifecycle } from "./roomCloseLifecycle.js";
import { createRoomDeadlineScheduler } from "./roomDeadlineScheduler.js";
import { saveGameRecord as persistGameRecord } from "./roomResultPersistence.js";
import { createRoomClockLifecycle } from "./roomClockLifecycle.js";
import { createRoomRestoreLifecycle } from "./roomRestoreLifecycle.js";
import { createRoomConnectionLifecycle } from "./roomConnectionLifecycle.js";
import { createRoomRequestLifecycle } from "./roomRequestLifecycle.js";
import { createRoomCreationLifecycle } from "./roomCreationLifecycle.js";
import { createRoomActionLifecycle } from "./roomActionLifecycle.js";
import { createRoomChatLifecycle } from "./roomChatLifecycle.js";
import { normalizeChatText, validateRoomCode } from "./security.js";

export { roomView };
export { clearRoomTimers };

const rooms = new Map();
const matchmakingQueue = createRoomMatchmakingQueue();
const ROOM_PERSIST_THROTTLE_MS = 5000;

export function getRoom(roomCode) {
  return rooms.get(roomCode);
}

function isRoomCodeTaken(roomCode) {
  return rooms.has(roomCode);
}

const roomCloseLifecycle = createRoomCloseLifecycle({
  rooms,
  clearRoomTimers,
  clearRoomTimeout,
  scheduleRoomTimeout,
  hasConnectedRoomParticipant,
  arePlayersDisconnected,
  emitRoomClosed,
  deletePersistedRoom: (roomCode) => deletePersistedRoomState(prisma, roomCode),
  persistRoom,
  appendSystem,
  saveGameRecord: (room) => persistGameRecord({ prisma, room }),
  prepareCloseState: prepareCandyEffectUpdates
});
const {
  scheduleRoomClose,
  closeRoom,
  scheduleEmptyActiveRoomClose,
  clearEmptyRoomClose
} = roomCloseLifecycle;
const roomDeadlineScheduler = createRoomDeadlineScheduler({
  rooms,
  scheduleRoomTimeout,
  appendSystem,
  broadcastRoom,
  completeRoomOpening,
  startInitialPassiveSkillNow
});
const {
  scheduleGameStart,
  scheduleInitialPassiveSkill,
  scheduleCountingTimeout,
  scheduleDrawTimeout,
  scheduleResultReviewTimeout,
  schedulePendingRoomDeadlines
} = roomDeadlineScheduler;
const roomSkillLifecycle = createRoomSkillLifecycle({
  rooms,
  scheduleRoomTimeout,
  appendSystem,
  appendNotices,
  resetByoYomi,
  scheduleRoomClose,
  broadcastRoom
});
const {
  startActiveSkill,
  maybeStartPassiveSkill,
  schedulePendingSkillResolution
} = roomSkillLifecycle;
const roomClockLifecycle = createRoomClockLifecycle({
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
});
const { startGameClock } = roomClockLifecycle;
const roomRestoreLifecycle = createRoomRestoreLifecycle({
  closeRoom,
  scheduleRoomClose,
  startGameClock,
  completeRoomOpening,
  scheduleGameStart,
  schedulePendingSkillResolution,
  schedulePendingRoomDeadlines,
  scheduleEmptyActiveRoomClose
});
const { resumeRoomTimers } = roomRestoreLifecycle;
const roomConnectionLifecycle = createRoomConnectionLifecycle({
  rooms,
  matchmakingQueue,
  validateRoomCode,
  appendSystem,
  clearEmptyRoomClose,
  scheduleEmptyActiveRoomClose,
  persistRoom
});
export const {
  attachSocketToRoom,
  detachSocket,
  leaveRoom
} = roomConnectionLifecycle;
const roomRequestLifecycle = createRoomRequestLifecycle({
  rooms,
  validateRoomCode,
  validateActionPoint,
  appendSystem,
  appendNotices,
  broadcastToast,
  scheduleCountingTimeout,
  scheduleDrawTimeout,
  scheduleResultReviewTimeout,
  scheduleRoomClose
});
export const {
  requestCounting,
  respondCounting,
  requestDraw,
  respondDraw,
  handleScoringAction
} = roomRequestLifecycle;
const roomCreationLifecycle = createRoomCreationLifecycle({
  rooms,
  matchmakingQueue,
  isRoomCodeTaken,
  persistRoom,
  startGameClock,
  scheduleGameStart,
  roomView,
  appendSystem,
  broadcastRoom
});
export const {
  joinMatchmaking,
  createDirectRoom
} = roomCreationLifecycle;
const roomActionLifecycle = createRoomActionLifecycle({
  rooms,
  validateRoomCode,
  validateActionPoint,
  appendSystem,
  appendNotices,
  startActiveSkill,
  broadcastToast,
  resetByoYomi,
  scheduleRoomClose,
  maybeStartPassiveSkill
});
export const { handleGameAction } = roomActionLifecycle;
const roomChatLifecycle = createRoomChatLifecycle({
  rooms,
  validateRoomCode,
  normalizeChatText
});
export const { addChat } = roomChatLifecycle;

export function listActiveRooms() {
  return [...rooms.values()].filter((room) => room.game.phase !== GAME_PHASES.finished);
}

export function listWatchRooms() {
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

export function isUserInActiveRoom(userId) {
  return listActiveRooms().some((room) => room.players.some((player) => player.user.id === userId));
}

export function findRoomForUser(userId, roomCode = "") {
  const candidates = roomCode ? [rooms.get(roomCode)] : [...rooms.values()];
  return candidates.find((room) => room?.players.some((player) => player.user.id === userId)) ?? null;
}

export function clearRoomsForTest() {
  for (const room of rooms.values()) {
    clearRoomTimers(room);
  }
  rooms.clear();
  matchmakingQueue.clear();
}

export async function restorePersistedRooms(io) {
  const rows = await listPersistedRooms(prisma);
  const restored = [];
  for (const row of rows) {
    try {
      const room = hydratePersistedRoom(JSON.parse(row.snapshot));
      if (!room?.code) continue;
      ensureRestoredDisconnectedNotices(room);
      rooms.set(room.code, room);
      restored.push(room);
      if (resumeRoomTimers(room, io) !== false) persistRoom(room, { force: true });
    } catch (error) {
      console.error(`Failed to restore room ${row.code}`, error);
    }
  }
  return restored;
}

export function listWaitingPlayers() {
  return matchmakingQueue.list();
}

export function matchmakingCount() {
  return matchmakingQueue.count();
}

export function matchmakingCountsByMode() {
  return matchmakingQueue.countsByMode();
}


export function leaveMatchmaking(userId) {
  matchmakingQueue.removeUser(userId);
}



export function broadcastRoom(io, room) {
  broadcastRoomUpdate(io, room, { persistRoom });
}

function broadcastToast(io, room, text) {
  broadcastRoomToast(io, room, text);
}

export function completeRoomOpening(room, io) {
  if (room.game.phase !== GAME_PHASES.opening) return false;
  room.game.phase = GAME_PHASES.playing;
  room.lastTick = Date.now();
  appendSystem(room, "对局开始。", { kind: "game-start" });
  broadcastRoom(io, room);
  scheduleInitialPassiveSkill(room, io);
  return true;
}

export function startInitialPassiveSkillNow(room, io) {
  return maybeStartPassiveSkill(room, io);
}

function persistRoom(room, { force = false } = {}) {
  persistRoomState({
    prisma,
    room,
    force,
    throttleMs: ROOM_PERSIST_THROTTLE_MS,
    onError: (error) => {
      console.error("Failed to persist room", error);
    }
  });
}
