import {
  COLORS,
  GAME_PHASES,
  exposeHiddenHands
} from "../src/shared/game.js";
import { gameModeById } from "../src/shared/gameModes.js";
import { prisma } from "./db.js";
import { applyStandardGameAction } from "./roomGameActions.js";
import { resetByoYomi } from "./roomClockTiming.js";
import { prepareCandyEffectUpdates } from "./roomItemEffects.js";
import { listPersistedRooms, deletePersistedRoom as deletePersistedRoomState } from "./roomPersistence.js";
import { hydratePersistedRoom, persistRoomState } from "./roomStatePersistence.js";
import {
  applyCountingRequest,
  applyCountingResponse,
  applyDrawRequest,
  applyDrawResponse,
  applyScoringAction
} from "./roomScoringFlow.js";
import { handleRoomTestAction, isRoomTestAction } from "./roomTestActions.js";
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
import { createRoom } from "./roomFactory.js";
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
import { normalizeChatText, validateRoomCode } from "./security.js";

export { roomView };
export { clearRoomTimers };

const rooms = new Map();
const matchmakingQueue = createRoomMatchmakingQueue();
const ROOM_PERSIST_THROTTLE_MS = 5000;
const EMPTY_ROOM_CLOSED_TOAST = "鎴块棿鍥犵┖缃?鍒嗛挓浠ヤ笂鑰岃鍏抽棴";

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

export function joinMatchmaking(player, io, { canPair = () => true } = {}) {
  const match = matchmakingQueue.join(player, { canPair });
  if (match.matched) {
    const first = match.opponent;
    const room = createRoom(first, match.player, {
      modeInput: match.mode,
      isCodeTaken: isRoomCodeTaken
    });
    rooms.set(room.code, room);
    persistRoom(room, { force: true });
    startGameClock(room, io);
    scheduleGameStart(room, io);
    io.to(first.socketId).emit("match:found", roomView(room, first.user.id));
    io.to(player.socketId).emit("match:found", roomView(room, player.user.id));
    appendSystem(room, "鍖归厤鎴愬姛锛?绉掑悗杩涘叆鏄熺偓瀵瑰紙銆?);
    broadcastRoom(io, room);
    return room;
  }
  return null;
}

export function leaveMatchmaking(userId) {
  matchmakingQueue.removeUser(userId);
}

export function attachSocketToRoom(roomCode, socket, user) {
  const validatedRoomCode = validateRoomCode(roomCode);
  if (!validatedRoomCode.ok) return null;
  const room = rooms.get(validatedRoomCode.value);
  if (!room) return null;
  const player = room.players.find((p) => p.user.id === user.id);
  if (player) {
    const shouldAnnounceReconnect = !player.socketId
      && player.disconnectedAt
      && room.game.phase !== GAME_PHASES.finished;
    player.socketId = socket.id;
    player.disconnectedAt = null;
    clearEmptyRoomClose(room);
    if (shouldAnnounceReconnect) {
      appendSystem(room, `${player.user.username}宸查噸鏂拌繛鎺ャ€俙, { kind: "reconnect" });
    }
  } else if (!room.spectators.some((p) => p.user.id === user.id)) {
    room.spectators.push({ user, socketId: socket.id });
    appendSystem(room, `${user.username}杩涘叆浜嗚鎴樺腑銆俙);
  }
  socket.join(validatedRoomCode.value);
  persistRoom(room, { force: true });
  return room;
}

export function detachSocket(socketId, io = null) {
  matchmakingQueue.removeSocket(socketId);
  const changedRooms = [];
  for (const room of rooms.values()) {
    let changed = false;
    for (const player of room.players) {
      if (player.socketId === socketId) {
        player.socketId = null;
        player.disconnectedAt = Date.now();
        if (room.game.phase !== GAME_PHASES.finished) {
          appendSystem(room, `${player.user.username}鏂嚎涓€俙, { kind: "disconnect" });
        }
        changed = true;
      }
    }
    const before = room.spectators.length;
    room.spectators = room.spectators.filter((s) => s.socketId !== socketId);
    if (room.spectators.length !== before) changed = true;
    if (changed) {
      if (io) scheduleEmptyActiveRoomClose(room, io);
      persistRoom(room, { force: true });
      changedRooms.push(room);
    }
  }
  return changedRooms;
}

export function leaveRoom(roomCode, userId, socketId = "") {
  const validatedRoomCode = validateRoomCode(roomCode);
  if (!validatedRoomCode.ok) return null;
  const room = rooms.get(validatedRoomCode.value);
  if (!room) return null;
  const finishedPlayer = room.game.phase === GAME_PHASES.finished
    ? room.players.find((candidate) => (
        candidate.user.id === userId && (!socketId || candidate.socketId === socketId)
      ))
    : null;
  if (finishedPlayer) {
    finishedPlayer.socketId = null;
    finishedPlayer.disconnectedAt = null;
    appendSystem(room, `${finishedPlayer.user.username}绂诲紑浜嗚鎴樺腑銆俙, { kind: "spectator-leave" });
    persistRoom(room, { force: true });
    return room;
  }
  const spectator = room.spectators.find((candidate) => (
    candidate.user.id === userId && (!socketId || candidate.socketId === socketId)
  ));
  if (!spectator) return null;
  room.spectators = room.spectators.filter((candidate) => candidate !== spectator);
  appendSystem(room, `${spectator.user.username}绂诲紑浜嗚鎴樺腑銆俙, { kind: "spectator-leave" });
  persistRoom(room, { force: true });
  return room;
}

export function createDirectRoom(first, second, io, modeInput = "spark") {
  const mode = normalizeGameModeId(modeInput);
  leaveMatchmaking(first.user.id);
  leaveMatchmaking(second.user.id);
  const room = createRoom({ ...first, mode }, { ...second, mode }, {
    modeInput: mode,
    isCodeTaken: isRoomCodeTaken
  });
  rooms.set(room.code, room);
  persistRoom(room, { force: true });
  startGameClock(room, io);
  scheduleGameStart(room, io);
  appendSystem(room, "瀵瑰眬鐢宠宸插悓鎰忥紝3绉掑悗杩涘叆鏄熺偓瀵瑰紙銆?);
  io.to(first.socketId).emit("match:found", roomView(room, first.user.id));
  io.to(second.socketId).emit("match:found", roomView(room, second.user.id));
  broadcastRoom(io, room);
  return room;
}

export function handleGameAction(roomCode, userId, action, io) {
  const validatedRoomCode = validateRoomCode(roomCode);
  if (!validatedRoomCode.ok) return { ok: false, error: validatedRoomCode.error };
  const code = validatedRoomCode.value;
  const room = rooms.get(code);
  if (!room) return { ok: false, error: "鎴块棿涓嶅瓨鍦? };
  const validationError = validateActionPoint(action, room.game.size);
  if (validationError) return { ok: false, error: validationError };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "瑙傛垬鑰呬笉鑳芥搷浣滄灞€" };
  if (room.game.pendingSkill) return { ok: false, error: "鎶€鑳芥紨鍑轰腑" };
  if (isRoomTestAction(action)) {
    const testAction = handleRoomTestAction({ action, player, room });
    if (!testAction.ok) return testAction;
    if (testAction.systemMessage) appendSystem(room, testAction.systemMessage);
    if (!testAction.result) return { ok: true, room };
    const result = testAction.result;
    if (!result.ok) return result;
    room.game = result.state;
    appendNotices(room, result.notices);
    return { ok: true, room };
  }

  if (action.type === "skill") {
    return startActiveSkill({ room, player, action, io });
  }

  return applyStandardGameAction({
    room,
    player,
    action,
    io,
    appendSystem,
    appendNotices,
    broadcastToast,
    resetByoYomi,
    scheduleRoomClose,
    maybeStartPassiveSkill
  });
}
export function requestCounting(roomCode, userId, io) {
  const validatedRoomCode = validateRoomCode(roomCode);
  if (!validatedRoomCode.ok) return { ok: false, error: validatedRoomCode.error };
  const code = validatedRoomCode.value;
  const room = rooms.get(code);
  if (!room) return { ok: false, error: "鎴块棿涓嶅瓨鍦? };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "瑙傛垬鑰呬笉鑳界敵璇锋暟瀛? };
  if (room.game.phase !== GAME_PHASES.playing) return { ok: false, error: "褰撳墠涓嶈兘鐢宠鏁板瓙" };

  return applyCountingRequest({
    room,
    player,
    userId,
    appendSystem,
    scheduleCountingTimeout,
    io
  });
}
export function respondCounting(roomCode, userId, accepted) {
  const validatedRoomCode = validateRoomCode(roomCode);
  if (!validatedRoomCode.ok) return { ok: false, error: validatedRoomCode.error };
  const room = rooms.get(validatedRoomCode.value);
  if (!room) return { ok: false, error: "鎴块棿涓嶅瓨鍦? };
  if (room.game.phase !== GAME_PHASES.countingRequested) return { ok: false, error: "褰撳墠娌℃湁鏁板瓙鐢宠" };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "瑙傛垬鑰呬笉鑳界‘璁ゆ暟瀛? };

  return applyCountingResponse({ room, player, userId, accepted, appendSystem });
}

export function requestDraw(roomCode, userId, io) {
  const validatedRoomCode = validateRoomCode(roomCode);
  if (!validatedRoomCode.ok) return { ok: false, error: validatedRoomCode.error };
  const code = validatedRoomCode.value;
  const room = rooms.get(code);
  if (!room) return { ok: false, error: "鎴块棿涓嶅瓨鍦? };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "瑙傛垬鑰呬笉鑳界敵璇峰拰妫? };
  if (room.game.phase !== GAME_PHASES.playing) return { ok: false, error: "褰撳墠涓嶈兘鐢宠鍜屾" };

  return applyDrawRequest({
    room,
    player,
    userId,
    appendSystem,
    scheduleDrawTimeout,
    io
  });
}

export function respondDraw(roomCode, userId, accepted, io) {
  const validatedRoomCode = validateRoomCode(roomCode);
  if (!validatedRoomCode.ok) return { ok: false, error: validatedRoomCode.error };
  const room = rooms.get(validatedRoomCode.value);
  if (!room) return { ok: false, error: "鎴块棿涓嶅瓨鍦? };
  if (room.game.phase !== GAME_PHASES.drawRequested) return { ok: false, error: "褰撳墠娌℃湁鍜屾鐢宠" };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "瑙傛垬鑰呬笉鑳界‘璁ゅ拰妫? };

  return applyDrawResponse({
    room,
    player,
    userId,
    accepted,
    appendSystem,
    broadcastToast,
    scheduleRoomClose,
    io
  });
}

export function handleScoringAction(roomCode, userId, action, io) {
  const validatedRoomCode = validateRoomCode(roomCode);
  if (!validatedRoomCode.ok) return { ok: false, error: validatedRoomCode.error };
  const room = rooms.get(validatedRoomCode.value);
  if (!room) return { ok: false, error: "鎴块棿涓嶅瓨鍦? };
  const validationError = validateActionPoint(action, room.game.size);
  if (validationError) return { ok: false, error: validationError };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "瑙傛垬鑰呬笉鑳界‘璁ゆ暟瀛? };

  if (["mark-dead", "mark-neutral", "reset-dead", "confirm-dead"].includes(action.type)) {
    if (room.game.phase !== GAME_PHASES.markingDead) return { ok: false, error: "褰撳墠涓嶅湪姝诲瓙纭闃舵" };
  }
  if (["accept-result", "reject-result"].includes(action.type)) {
    if (room.game.phase !== GAME_PHASES.resultReview) return { ok: false, error: "褰撳墠涓嶅湪缁撴灉纭闃舵" };
  }

  return applyScoringAction({
    room,
    player,
    userId,
    action,
    appendSystem,
    appendNotices,
    broadcastToast,
    scheduleResultReviewTimeout,
    scheduleRoomClose,
    io
  });
}

export function addChat(roomCode, user, text) {
  const validatedRoomCode = validateRoomCode(roomCode);
  if (!validatedRoomCode.ok) return null;
  const normalizedText = normalizeChatText(text);
  if (!normalizedText.ok) return null;
  const room = rooms.get(validatedRoomCode.value);
  if (!room) return null;
  room.chat.push({
    id: crypto.randomUUID(),
    type: "chat",
    userId: user.id,
    username: user.username,
    moveNumber: room.game.moveNumber,
    text: normalizedText.value,
    createdAt: Date.now()
  });
  return room;
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
  appendSystem(room, "瀵瑰眬寮€濮嬨€?, { kind: "game-start" });
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