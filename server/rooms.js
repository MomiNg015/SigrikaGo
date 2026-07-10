import { prisma } from "./db.js";
import { resetByoYomi } from "./roomClockTiming.js";
import { prepareCandyEffectUpdates } from "./roomItemEffects.js";
import { deletePersistedRoom as deletePersistedRoomState, listPersistedRooms } from "./roomPersistence.js";
import { flushRoomPersistence, hydratePersistedRoom, persistRoomState } from "./roomStatePersistence.js";
import {
  broadcastRoom as broadcastRoomUpdate,
  broadcastRoomClock,
  broadcastRoomPatch as broadcastRoomPatchEvent,
  broadcastRoomPresencePatch as broadcastRoomPresencePatchEvent,
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
  hasConnectedRoomParticipant
} from "./roomPresence.js";
import { createRoomMatchmakingQueue } from "./roomMatchmakingQueue.js";
import { createRoomMembershipIndex } from "./roomMembershipIndex.js";
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
import { createRoomQueries } from "./roomQueries.js";
import { createRoomPersistenceRestoreLifecycle } from "./roomPersistenceRestoreLifecycle.js";
import { createRoomOpeningLifecycle } from "./roomOpeningLifecycle.js";
import { createRoomPreparationLifecycle } from "./roomPreparationLifecycle.js";
import { createRoomRuntime } from "./roomRuntime.js";
import { normalizeChatText, validateRoomCode } from "./security.js";
import { runtimeStabilityMetrics } from "./runtimeStabilityMetrics.js";
import { roomSpectatorAdmission, runtimeCapacityLimits } from "./runtimeServiceState.js";

export { roomView };
export { clearRoomTimers };
export { flushRoomPersistence };

const rooms = new Map();
const matchmakingQueue = createRoomMatchmakingQueue();
const roomMembershipIndex = createRoomMembershipIndex({ rooms });
const ROOM_PERSIST_THROTTLE_MS = 5000;
const runtimeLimits = runtimeCapacityLimits();
const roomRuntime = createRoomRuntime({
  prisma,
  persistRoomState,
  broadcastRoomUpdate,
  broadcastRoomPatch: broadcastRoomPatchEvent,
  broadcastRoomPresencePatch: broadcastRoomPresencePatchEvent,
  broadcastRoomToast,
  metrics: runtimeStabilityMetrics,
  throttleMs: ROOM_PERSIST_THROTTLE_MS
});
const {
  persistRoom,
  broadcastToast
} = roomRuntime;
export const { broadcastRoom, broadcastRoomPatch, broadcastRoomPresencePatch } = roomRuntime;

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
  deletePersistedRoom: async (roomCode) => {
    await flushRoomPersistence(roomCode);
    return deletePersistedRoomState(prisma, roomCode);
  },
  persistRoom,
  appendSystem,
  saveGameRecord: (room) => persistGameRecord({ prisma, room }),
  unregisterRoom: roomMembershipIndex.unregisterRoom,
  prepareCloseState: prepareCandyEffectUpdates,
  metrics: runtimeStabilityMetrics
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
const roomPreparationLifecycle = createRoomPreparationLifecycle({
  rooms,
  clearRoomTimers,
  deletePersistedRoom: async (roomCode) => {
    await flushRoomPersistence(roomCode);
    return deletePersistedRoomState(prisma, roomCode);
  },
  unregisterRoom: roomMembershipIndex.unregisterRoom,
  scheduleRoomTimeout,
  appendSystem,
  broadcastRoom,
  scheduleGameStart,
  metrics: runtimeStabilityMetrics
});
const {
  markRoomPreloadReady,
  scheduleRoomPreloadTimeout
} = roomPreparationLifecycle;
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
  schedulePendingSkillResolution,
  completePendingSkillResolution
} = roomSkillLifecycle;
const roomOpeningLifecycle = createRoomOpeningLifecycle({
  appendSystem,
  broadcastRoom,
  scheduleInitialPassiveSkill,
  maybeStartPassiveSkill
});
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
  scheduleRoomPreloadTimeout,
  schedulePendingSkillResolution,
  completePendingSkillResolution,
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
  persistRoom,
  findRoomsForSocket: roomMembershipIndex.findRoomsForSocket,
  registerRoomSocket: roomMembershipIndex.registerSocket,
  unregisterRoomSocket: roomMembershipIndex.unregisterSocket,
  admitSpectator: (room, user) => roomSpectatorAdmission(room, user?.id, runtimeLimits)
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
  scheduleRoomPreloadTimeout,
  roomView,
  appendSystem,
  registerRoom: roomMembershipIndex.registerRoom
});
export const {
  joinMatchmaking,
  createDirectRoom
} = roomCreationLifecycle;
export { markRoomPreloadReady };
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
const roomQueries = createRoomQueries({ rooms, membershipIndex: roomMembershipIndex });
export const {
  listActiveRooms,
  listWatchRooms,
  isUserInActiveRoom,
  findRoomForUser
} = roomQueries;
const roomPersistenceRestoreLifecycle = createRoomPersistenceRestoreLifecycle({
  rooms,
  listPersistedRooms: () => listPersistedRooms(prisma),
  hydratePersistedRoom,
  ensureRestoredDisconnectedNotices,
  resumeRoomTimers,
  persistRoom,
  registerRoom: roomMembershipIndex.registerRoom,
  metrics: runtimeStabilityMetrics
});
export const { restorePersistedRooms } = roomPersistenceRestoreLifecycle;

export function clearRoomsForTest() {
  for (const room of rooms.values()) {
    clearRoomTimers(room);
  }
  rooms.clear();
  roomMembershipIndex.clear();
  matchmakingQueue.clear();
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



export function completeRoomOpening(room, io) {
  return roomOpeningLifecycle.completeRoomOpening(room, io);
}

export function startInitialPassiveSkillNow(room, io) {
  return roomOpeningLifecycle.startInitialPassiveSkillNow(room, io);
}
