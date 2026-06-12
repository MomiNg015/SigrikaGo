import {
  COLORS,
  GAME_PHASES,
  INVALID_EARLY_RESIGN_NOTICE,
  activatePassiveSkill,
  canStartSkill,
  createGameState,
  createTimeoutResult,
  exposeHiddenHands,
  getPoint,
  opponent,
  parsePointId,
  resultWithInvalidFlagForGame,
  restoreSuspendedHiddenHands,
  skillUsesBoardConfirmation,
  useSkill
} from "../src/shared/game.js";
import { CHARACTERS } from "../src/shared/characters.js";
import { GAME_MODE_IDS, gameModeById, normalizeGameModeId } from "../src/shared/gameModes.js";
import { DEFAULT_RANK, normalizeRank, parseRecentResults, serializeRecentResults } from "../src/shared/rankProgression.js";
import { resultRewardDelta } from "../src/shared/resultRewards.js";
import { prisma } from "./db.js";
import { gameResultMetadata } from "./gameRecords.js";
import { applyStandardGameAction } from "./roomGameActions.js";
import { resetByoYomi, tickPlayerClock } from "./roomClockTiming.js";
import { candyEffectData, prepareCandyEffectUpdates } from "./roomItemEffects.js";
import { structuredUserItemEffectSyncOperations } from "./userAssets.js";
import {
  PROGRESS_METRICS,
  PROGRESS_REASONS,
  progressLedgerCreateOperations
} from "./userProgressLedger.js";
import { deletePersistedRoom, listPersistedRooms } from "./roomPersistence.js";
import { hydratePersistedRoom, persistRoomState } from "./roomStatePersistence.js";
import { applyResultRewardsToRoomUsers } from "./roomRewards.js";
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
import {
  SKILL_BANNER_DURATION_MS,
  SKILL_BOARD_EFFECT_DURATION_MS,
  canSchedulePendingSkillResolution,
  createPendingSkillResolution,
  pendingSkillResolutionDelay
} from "./roomSkillResolution.js";
import { normalizeChatText, validatePointId, validateRoomCode } from "./security.js";

export { roomView };
export { clearRoomTimers };

const rooms = new Map();
let waitingPlayers = [];
const MATCH_SUCCESS_DELAY_MS = 3000;
const OPENING_NOTICE_DELAY_MS = 3000;
const INITIAL_PASSIVE_SKILL_DELAY_MS = 3000;
const ROOM_CLOSE_DELAY_MS = 5 * 60 * 1000;
const INVALID_ROOM_CLOSE_DELAY_MS = 30 * 1000;
const EMPTY_ACTIVE_ROOM_CLOSE_MS = 5 * 60 * 1000;
const ROOM_PERSIST_THROTTLE_MS = 5000;
const EMPTY_ROOM_CLOSED_TOAST = "房间因空置5分钟以上而被关闭";

export function getRoom(roomCode) {
  return rooms.get(roomCode);
}

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
  waitingPlayers = [];
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

function ensureRestoredDisconnectedNotices(room) {
  if (room.game.phase === GAME_PHASES.finished) return;
  for (const player of room.players) {
    if (player.socketId || !player.disconnectedAt) continue;
    const username = player.user?.username ?? "";
    const alreadyAnnounced = room.chat.some((message) => (
      message.kind === "disconnect"
      && message.text?.includes(username)
      && message.text?.includes("断线中")
    ));
    if (!alreadyAnnounced) appendSystem(room, `${username}断线中。`, { kind: "disconnect" });
  }
}

export function listWaitingPlayers() {
  return [...waitingPlayers];
}

export function matchmakingCount() {
  return waitingPlayers.length;
}

export function matchmakingCountsByMode() {
  const counts = Object.fromEntries(GAME_MODE_IDS.map((mode) => [mode, 0]));
  for (const player of waitingPlayers) {
    counts[normalizeGameModeId(player.mode)] += 1;
  }
  return counts;
}

export function joinMatchmaking(player, io, { canPair = () => true } = {}) {
  const mode = normalizeGameModeId(player.mode);
  const queuedPlayer = { ...player, mode };
  waitingPlayers = waitingPlayers.filter((candidate) => (
    candidate.user.id !== player.user.id && candidate.socketId !== player.socketId
  ));
  const opponentIndex = waitingPlayers.findIndex((candidate) => (
    normalizeGameModeId(candidate.mode) === mode && canPair(candidate, queuedPlayer)
  ));
  if (opponentIndex >= 0) {
    const [first] = waitingPlayers.splice(opponentIndex, 1);
    const room = createRoom(first, queuedPlayer, mode);
    rooms.set(room.code, room);
    persistRoom(room, { force: true });
    startGameClock(room, io);
    scheduleGameStart(room, io);
    io.to(first.socketId).emit("match:found", roomView(room, first.user.id));
    io.to(player.socketId).emit("match:found", roomView(room, player.user.id));
    appendSystem(room, "匹配成功，3秒后进入星炬对弈。");
    broadcastRoom(io, room);
    return room;
  }
  waitingPlayers.push(queuedPlayer);
  return null;
}

export function leaveMatchmaking(userId) {
  waitingPlayers = waitingPlayers.filter((player) => player.user.id !== userId);
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
      appendSystem(room, `${player.user.username}已重新连接。`, { kind: "reconnect" });
    }
  } else if (!room.spectators.some((p) => p.user.id === user.id)) {
    room.spectators.push({ user, socketId: socket.id });
    appendSystem(room, `${user.username}进入了观战席。`);
  }
  socket.join(validatedRoomCode.value);
  persistRoom(room, { force: true });
  return room;
}

export function detachSocket(socketId, io = null) {
  waitingPlayers = waitingPlayers.filter((player) => player.socketId !== socketId);
  const changedRooms = [];
  for (const room of rooms.values()) {
    let changed = false;
    for (const player of room.players) {
      if (player.socketId === socketId) {
        player.socketId = null;
        player.disconnectedAt = Date.now();
        if (room.game.phase !== GAME_PHASES.finished) {
          appendSystem(room, `${player.user.username}断线中。`, { kind: "disconnect" });
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
    appendSystem(room, `${finishedPlayer.user.username}离开了观战席。`, { kind: "spectator-leave" });
    persistRoom(room, { force: true });
    return room;
  }
  const spectator = room.spectators.find((candidate) => (
    candidate.user.id === userId && (!socketId || candidate.socketId === socketId)
  ));
  if (!spectator) return null;
  room.spectators = room.spectators.filter((candidate) => candidate !== spectator);
  appendSystem(room, `${spectator.user.username}离开了观战席。`, { kind: "spectator-leave" });
  persistRoom(room, { force: true });
  return room;
}

export function createDirectRoom(first, second, io, modeInput = "spark") {
  const mode = normalizeGameModeId(modeInput);
  leaveMatchmaking(first.user.id);
  leaveMatchmaking(second.user.id);
  const room = createRoom({ ...first, mode }, { ...second, mode }, mode);
  rooms.set(room.code, room);
  persistRoom(room, { force: true });
  startGameClock(room, io);
  scheduleGameStart(room, io);
  appendSystem(room, "对局申请已同意，3秒后进入星炬对弈。");
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
  if (!room) return { ok: false, error: "房间不存在" };
  const validationError = validateActionPoint(action, room.game.size);
  if (validationError) return { ok: false, error: validationError };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "观战者不能操作棋局" };
  if (room.game.pendingSkill) return { ok: false, error: "技能演出中" };
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
    const skillConfig = player.character?.skill ?? player.characterId;
    if (!canStartSkill(room.game, skillConfig)) return { ok: false, error: "场上没有可作用的棋子" };
    const skillTargetId = skillUsesBoardConfirmation(skillConfig) ? null : action.pointId;
    const result = useSkill(room.game, player.color, skillConfig, skillTargetId);
    if (!result.ok) return result;
    const skillNotice = describeSkillUse(room, player, skillTargetId);

    const character = player.character ?? CHARACTERS[player.characterId] ?? CHARACTERS.sigrika;
    const skill = character.skill ?? CHARACTERS[player.characterId]?.skill ?? CHARACTERS.sigrika.skill;
    const pendingSkillId = crypto.randomUUID();
    room.pendingSkillResolution = createPendingSkillResolution({
      pendingSkillId,
      game: result.state,
      notices: result.notices ?? [],
      playerColor: player.color
    });
    const pendingSkill = buildPendingSkillPreview({
      pendingSkillId,
      player,
      character,
      skill,
      requestedTargetId: skillTargetId,
      resolvedGame: result.state,
      resolvesAt: room.pendingSkillResolution.resolvesAt
    });
    room.game = {
      ...room.game,
      phase: GAME_PHASES.skillPreview,
      pendingSkill
    };
    appendSystem(room, skillNotice, { kind: "skill" });
    schedulePendingSkillResolution(room, io);
    return { ok: true, room };
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
  if (!room) return { ok: false, error: "房间不存在" };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "观战者不能申请数子" };
  if (room.game.phase !== GAME_PHASES.playing) return { ok: false, error: "当前不能申请数子" };

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
  if (!room) return { ok: false, error: "房间不存在" };
  if (room.game.phase !== GAME_PHASES.countingRequested) return { ok: false, error: "当前没有数子申请" };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "观战者不能确认数子" };

  return applyCountingResponse({ room, player, userId, accepted, appendSystem });
}

export function requestDraw(roomCode, userId, io) {
  const validatedRoomCode = validateRoomCode(roomCode);
  if (!validatedRoomCode.ok) return { ok: false, error: validatedRoomCode.error };
  const code = validatedRoomCode.value;
  const room = rooms.get(code);
  if (!room) return { ok: false, error: "房间不存在" };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "观战者不能申请和棋" };
  if (room.game.phase !== GAME_PHASES.playing) return { ok: false, error: "当前不能申请和棋" };

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
  if (!room) return { ok: false, error: "房间不存在" };
  if (room.game.phase !== GAME_PHASES.drawRequested) return { ok: false, error: "当前没有和棋申请" };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "观战者不能确认和棋" };

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
  if (!room) return { ok: false, error: "房间不存在" };
  const validationError = validateActionPoint(action, room.game.size);
  if (validationError) return { ok: false, error: validationError };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "观战者不能确认数子" };

  if (["mark-dead", "mark-neutral", "reset-dead", "confirm-dead"].includes(action.type)) {
    if (room.game.phase !== GAME_PHASES.markingDead) return { ok: false, error: "当前不在死子确认阶段" };
  }
  if (["accept-result", "reject-result"].includes(action.type)) {
    if (room.game.phase !== GAME_PHASES.resultReview) return { ok: false, error: "当前不在结果确认阶段" };
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

function validateActionPoint(action, boardSize) {
  if (!action || typeof action !== "object") return "未知操作";
  if (action.pointId == null) return null;
  const point = validatePointId(action.pointId, boardSize);
  return point.ok ? null : point.error;
}

function createRoom(first, second, modeInput = first.mode ?? second.mode ?? "spark") {
  const mode = normalizeGameModeId(modeInput);
  const blackFirst = Math.random() >= 0.5;
  const players = [
    toRoomPlayer(blackFirst ? first : second, COLORS.black, mode),
    toRoomPlayer(blackFirst ? second : first, COLORS.white, mode)
  ];
  const createdAt = Date.now();
  const game = createGameState(players.map((p) => ({
    userId: p.user.id,
    color: p.color,
    characterId: p.characterId,
    character: p.character
  })), { mode });
  game.phase = GAME_PHASES.opening;
  return {
    code: randomRoomCode(),
    mode,
    players,
    spectators: [],
    game,
    chat: [],
    createdAt,
    openingEndsAt: createdAt + MATCH_SUCCESS_DELAY_MS + OPENING_NOTICE_DELAY_MS,
    closesAt: null,
    countingDeadline: null,
    drawDeadline: null,
    timerId: null,
    timeoutIds: [],
    lastTick: Date.now(),
    recordSaved: false
  };
}

function toRoomPlayer(player, color, mode = "spark") {
  return {
    user: userForRoomMode(player.user, mode),
    socketId: player.socketId,
    disconnectedAt: null,
    color,
    characterId: player.user.selectedCharacter,
    character: player.user.characterConfig ?? null,
    time: {
      main: 5 * 60,
      byoYomi: 30,
      periodRemaining: 30,
      periods: 3
    }
  };
}

function userForRoomMode(user, mode) {
  const normalizedMode = normalizeGameModeId(mode);
  const stats = modeStatsForUser(user, normalizedMode);
  return {
    ...user,
    rating: stats.rating,
    rank: stats.rank,
    wins: stats.wins,
    losses: stats.losses
  };
}

function modeStatsForUser(user, mode) {
  const stats = user?.modeStats?.[mode] ?? (
    Array.isArray(user?.modeStats)
      ? user.modeStats.find((entry) => normalizeGameModeId(entry.mode) === mode)
      : null
  );
  return {
    rating: Number(stats?.rating ?? (mode === "spark" ? user?.rating : 1000) ?? 1000),
    rank: normalizeRank(stats?.rank ?? (mode === "spark" ? user?.rank : DEFAULT_RANK)),
    recentResults: parseRecentResults(stats?.recentResults),
    wins: Number(stats?.wins ?? (mode === "spark" ? user?.wins : 0) ?? 0),
    losses: Number(stats?.losses ?? (mode === "spark" ? user?.losses : 0) ?? 0),
    draws: Number(stats?.draws ?? 0)
  };
}

function randomRoomCode() {
  let code = "";
  do {
    code = String(Math.floor(10000 + Math.random() * 90000));
  } while (rooms.has(code));
  return code;
}

function appendSystem(room, text, options = {}) {
  room.chat.push({
    id: crypto.randomUUID(),
    type: "system",
    kind: options.kind ?? null,
    moveNumber: room.game.moveNumber,
    text,
    createdAt: Date.now()
  });
}

function appendNotices(room, notices = []) {
  for (const text of notices) {
    appendSystem(room, text);
  }
}

function maybeStartPassiveSkill(room, io) {
  if (room.game.phase !== GAME_PHASES.playing || room.game.pendingSkill) return false;
  const player = room.players.find((candidate) => candidate.color === room.game.turn);
  const skill = player?.character?.skill ?? CHARACTERS[player?.characterId]?.skill;
  const effectType = skill?.effectType ?? skill?.id;
  if (effectType !== "color-illusion-passive") return false;
  if (room.game.passives?.[player.color]?.colorIllusion?.triggered) return false;
  const character = player.character ?? CHARACTERS[player.characterId] ?? CHARACTERS.nabomo;
  const pendingSkillId = crypto.randomUUID();
  const result = activatePassiveSkill(room.game, player.color, skill);
  if (!result.ok) return false;
  room.pendingSkillResolution = createPendingSkillResolution({
    pendingSkillId,
    game: result.state,
    notices: result.notices ?? [],
    playerColor: player.color
  });
  const pendingSkill = buildPendingSkillPreview({
    pendingSkillId,
    player,
    character,
    skill,
    requestedTargetId: null,
    resolvedGame: result.state,
    resolvesAt: room.pendingSkillResolution.resolvesAt
  });
  room.game = {
    ...room.game,
    phase: GAME_PHASES.skillPreview,
    pendingSkill
  };
  appendSystem(room, describeSkillUse(room, player, null), { kind: "skill" });
  schedulePendingSkillResolution(room, io);
  return true;
}

function buildPendingSkillPreview({
  pendingSkillId,
  player,
  character,
  skill,
  requestedTargetId,
  resolvedGame,
  resolvesAt
}) {
  const skillAction = [...(resolvedGame.history ?? [])].reverse().find((entry) => entry.type === "skill");
  const effectType = skillAction?.effectType ?? skill?.effectType ?? skill?.id ?? "";
  const targetId = skillAction?.id ?? requestedTargetId ?? null;
  const markedPointIds = Array.isArray(skillAction?.marked) ? skillAction.marked : [];
  const affectedPointIds = affectedPointIdsForSkillAction({ effectType, targetId, markedPointIds });

  return {
    id: pendingSkillId,
    color: player.color,
    username: player.user.username,
    characterId: character.id ?? player.characterId,
    character: player.character ?? null,
    characterName: character.name,
    itemEffects: player.user.itemEffects ?? {},
    skillName: skill.name,
    effectType,
    targetId,
    affectedPointIds,
    markedPointIds,
    removed: skillAction?.removed ?? 0,
    removedByColor: skillAction?.removedByColor ?? null,
    resolvesAt,
    bannerDurationMs: SKILL_BANNER_DURATION_MS,
    boardEffectDurationMs: SKILL_BOARD_EFFECT_DURATION_MS
  };
}

function affectedPointIdsForSkillAction({ effectType, targetId, markedPointIds }) {
  if (effectType === "random-blast") return markedPointIds;
  return targetId ? [targetId] : [];
}

function schedulePendingSkillResolution(room, io) {
  const resolution = room.pendingSkillResolution;
  if (!canSchedulePendingSkillResolution(resolution)) return false;
  const delay = pendingSkillResolutionDelay(resolution);
  scheduleRoomTimeout(room, () => {
    completePendingSkillResolution(room.code, resolution.pendingSkillId, io);
  }, delay);
  return true;
}

function completePendingSkillResolution(roomCode, pendingSkillId, io) {
  const latest = rooms.get(roomCode);
  if (!latest || latest.game.pendingSkill?.id !== pendingSkillId) return false;
  const resolution = latest.pendingSkillResolution;
  if (!resolution?.game) return false;
  const resolvedGame = structuredClone(resolution.game);
  resolvedGame.pendingSkill = null;
  latest.pendingSkillResolution = null;
  latest.game = resolvedGame;
  const player = latest.players.find((candidate) => candidate.color === resolution.playerColor);
  if (player) resetByoYomi(player);
  appendNotices(latest, resolution.notices ?? []);
  if (latest.game.phase === GAME_PHASES.finished) scheduleRoomClose(roomCode, io);
  else maybeStartPassiveSkill(latest, io);
  broadcastRoom(io, latest);
  return true;
}

function scheduleGameStart(room, io) {
  const delay = Math.max(0, room.openingEndsAt - Date.now());
  scheduleRoomTimeout(room, () => {
    const latest = rooms.get(room.code);
    if (!latest) return;
    completeRoomOpening(latest, io);
  }, delay);
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

function scheduleInitialPassiveSkill(room, io) {
  scheduleRoomTimeout(room, () => {
    const latest = rooms.get(room.code);
    if (!latest || latest.game.phase !== GAME_PHASES.playing) return;
    if (startInitialPassiveSkillNow(latest, io)) broadcastRoom(io, latest);
  }, INITIAL_PASSIVE_SKILL_DELAY_MS);
}

function scheduleCountingTimeout(room, io) {
  const delay = Math.max(0, (room.countingDeadline ?? Date.now()) - Date.now());
  scheduleRoomTimeout(room, () => {
    const latest = rooms.get(room.code);
    if (latest?.game.phase === GAME_PHASES.countingRequested && latest.countingDeadline && Date.now() >= latest.countingDeadline) {
      restoreSuspendedHiddenHands(latest.game);
      latest.game.phase = GAME_PHASES.playing;
      latest.game.scoring = null;
      latest.countingDeadline = null;
      appendSystem(latest, "数子申请超时，视为不同意数子。");
      broadcastRoom(io, latest);
    }
  }, delay);
}

function scheduleDrawTimeout(room, io) {
  const delay = Math.max(0, (room.drawDeadline ?? Date.now()) - Date.now());
  scheduleRoomTimeout(room, () => {
    const latest = rooms.get(room.code);
    if (latest?.game.phase === GAME_PHASES.drawRequested && latest.drawDeadline && Date.now() >= latest.drawDeadline) {
      latest.game.phase = GAME_PHASES.playing;
      latest.game.drawRequest = null;
      latest.drawDeadline = null;
      appendSystem(latest, "和棋申请超时，对局继续。");
      broadcastRoom(io, latest);
    }
  }, delay);
}

export function startInitialPassiveSkillNow(room, io) {
  return maybeStartPassiveSkill(room, io);
}

function describeSkillUse(room, player, targetId) {
  const character = player.character ?? CHARACTERS[player.characterId] ?? CHARACTERS.sigrika;
  const skill = character.skill ?? CHARACTERS[player.characterId]?.skill ?? CHARACTERS.sigrika.skill;
  const effectType = skill.effectType ?? skill.id;
  const colorLabel = player.color === COLORS.black ? "黑" : "白";
  const targetStone = getPoint(room.game, targetId)?.stone;
  const fromColor = stoneLabel(player.color);
  const toColor = stoneLabel(opponent(targetStone ?? player.color));
  const targetColor = stoneLabel(targetStone);
  const fixed = `${colorLabel}方${player.user.username}使用了${character.name}的“${skill.name}”技能`;
  const coord = targetId ? formatPointLabel(targetId) : "无目标";
  if (skill.systemMessage) {
    return renderSkillMessage(skill.systemMessage, {
      player: player.user.username,
      character: character.name,
      skill: skill.name,
      point: coord,
      color: colorLabel,
      fromColor,
      toColor,
      targetColor
    });
  }
  if (effectType === "erase-point") {
    return `${fixed}。从天而降破坏了${coord}的点位，铛！`;
  }
  if (effectType === "flip-stone") {
    const point = getPoint(room.game, targetId);
    const from = stoneLabel(point?.stone);
    const to = stoneLabel(point?.stone ? opponent(point.stone) : null);
    return `${fixed}。诅咒了${coord}的${from}，将其从${from}变成了${to}。`;
  }
  if (effectType === "hidden-hand" || player.characterId === "aemeath") {
    return `${fixed}。落下了电子幽灵般的一手，应该不会被发现吧...`;
  }
  return `${fixed}。`;
}

function renderSkillMessage(template, values) {
  return String(template)
    .replaceAll("{player}", values.player)
    .replaceAll("{character}", values.character)
    .replaceAll("{skill}", values.skill)
    .replaceAll("{point}", values.point)
    .replaceAll("{fromColor}", values.fromColor)
    .replaceAll("{toColor}", values.toColor)
    .replaceAll("{targetColor}", values.targetColor)
    .replaceAll("{color}", values.color);
}

function formatPointLabel(id) {
  const { x, y } = parsePointId(id);
  return `${"ABCDEFGHJKLMN"[x]}-${13 - y}`;
}

function stoneLabel(color) {
  if (color === COLORS.black) return "黑棋";
  if (color === COLORS.white) return "白棋";
  return "棋子";
}

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
    const active = room.players.find((p) => p.color === room.game.turn);
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

function scheduleResultReviewTimeout(roomOrCode, io) {
  const room = typeof roomOrCode === "string" ? rooms.get(roomOrCode) : roomOrCode;
  if (!room) return;
  const delay = Math.max(0, (room.game.scoring?.resultDeadline ?? Date.now()) - Date.now());
  scheduleRoomTimeout(room, () => {
    const latest = rooms.get(room.code);
    const deadline = latest?.game.scoring?.resultDeadline;
    if (latest?.game.phase === GAME_PHASES.resultReview && deadline && Date.now() >= deadline) {
      latest.game.phase = GAME_PHASES.playing;
      latest.game.scoring = null;
      appendSystem(latest, "数子结果确认超时，对局继续。");
      broadcastRoom(io, latest);
    }
  }, delay);
}

function scheduleRoomClose(roomCode, io) {
  const room = rooms.get(roomCode);
  if (!room) return;
  if (!room.recordSaved) {
    prepareCandyEffectUpdates(room);
    saveGameRecord(room).catch((error) => {
      console.error("Failed to save game record", error);
    });
  }
  const closeDelay = roomCloseDelay(room);
  const nextClosesAt = Date.now() + closeDelay;
  if (!room.closesAt || (room.game.winner?.invalid && room.closesAt > nextClosesAt)) {
    room.closesAt = nextClosesAt;
  }
  persistRoom(room, { force: true });
  scheduleRoomTimeout(room, () => {
    const latest = rooms.get(roomCode);
    if (!latest) return;
    if (!latest.game.winner?.invalid && hasConnectedRoomParticipant(latest)) {
      latest.closesAt = Date.now() + roomCloseDelay(latest);
      persistRoom(latest, { force: true });
      scheduleRoomClose(roomCode, io);
      return;
    }
    closeRoom(roomCode, io, { reason: "finished-room-close" });
  }, Math.max(0, room.closesAt - Date.now()));
}

function roomCloseDelay(room) {
  return room?.game?.winner?.invalid ? INVALID_ROOM_CLOSE_DELAY_MS : ROOM_CLOSE_DELAY_MS;
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
  deletePersistedRoom(prisma, roomCode).catch((error) => {
    console.error("Failed to delete persisted room", error);
  });
}

function scheduleEmptyActiveRoomClose(room, io) {
  if (!room || room.game.phase === GAME_PHASES.finished) return;
  if (!arePlayersDisconnected(room)) {
    clearEmptyRoomClose(room);
    return;
  }
  room.emptySince ??= Date.now();
  if (room.emptyTimerId) return;
  const delay = Math.max(0, room.emptySince + EMPTY_ACTIVE_ROOM_CLOSE_MS - Date.now());
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

function resumeRoomTimers(room, io) {
  if (room.game.phase === GAME_PHASES.finished) {
    if (room.closesAt && room.closesAt <= Date.now()) {
      closeRoom(room.code, io, { reason: "finished-room-close" });
      return false;
    }
    scheduleRoomClose(room.code, io);
    return true;
  }
  if (room.game.phase === GAME_PHASES.opening) {
    startGameClock(room, io);
    if (room.openingEndsAt <= Date.now()) completeRoomOpening(room, io);
    else scheduleGameStart(room, io);
  } else {
    if (room.game.phase === GAME_PHASES.skillPreview) {
      if (!schedulePendingSkillResolution(room, io)) {
        room.game.phase = GAME_PHASES.playing;
        room.game.pendingSkill = null;
      }
    }
    startGameClock(room, io);
    schedulePendingRoomDeadlines(room, io);
    scheduleEmptyActiveRoomClose(room, io);
  }
  return true;
}

function schedulePendingRoomDeadlines(room, io) {
  if (room.game.phase === GAME_PHASES.countingRequested && room.countingDeadline) {
    scheduleCountingTimeout(room, io);
  }
  if (room.game.phase === GAME_PHASES.drawRequested && room.drawDeadline) {
    scheduleDrawTimeout(room, io);
  }
  if (room.game.phase === GAME_PHASES.resultReview && room.game.scoring?.resultDeadline) {
    scheduleResultReviewTimeout(room.code, io);
  }
}

async function saveGameRecord(room) {
  if (room.recordSaved || room.game.phase !== GAME_PHASES.finished) return;
  if (room.game.winner?.invalid) {
    room.recordSaved = true;
    return;
  }
  const black = room.players.find((player) => player.color === COLORS.black);
  const white = room.players.find((player) => player.color === COLORS.white);
  if (!black || !white) return;
  const candyEffectUpdates = prepareCandyEffectUpdates(room);
  const candyEffectAssetOperations = () => candyEffectUpdates.flatMap(({ player }) => (
    structuredUserItemEffectSyncOperations(prisma, player.user)
  ));
  room.recordSaved = true;
  const resultMetadata = gameResultMetadata(room.game.winner);
  const createRecord = () => prisma.gameRecord.create({
    data: {
      roomCode: room.code,
      blackUserId: black.user.id,
      whiteUserId: white.user.id,
      blackName: black.user.username,
      whiteName: white.user.username,
      blackCharacter: black.characterId,
      whiteCharacter: white.characterId,
      resultText: room.game.winner?.text ?? "对局结束",
      winnerColor: resultMetadata.winnerColor,
      resultReason: resultMetadata.resultReason,
      moveCount: room.game.moveNumber,
      mode: room.mode ?? room.game.mode ?? "spark",
      snapshot: JSON.stringify(roomView(room, black.user.id)),
      snapshotVersion: 1
    }
  });
  const mode = normalizeGameModeId(room.mode ?? room.game.mode);
  if (![COLORS.black, COLORS.white].includes(room.game.winner?.winnerColor)) {
    applyDrawResultToRoomUser(black, mode);
    applyDrawResultToRoomUser(white, mode);
    const recordCreate = createRecord();
    const operations = [
      recordCreate,
      prisma.userModeStats.upsert(modeStatsUpsertOperation(black, mode, { drawsDelta: 1 })),
      prisma.userModeStats.upsert(modeStatsUpsertOperation(white, mode, { drawsDelta: 1 })),
      ...candyEffectUpdates.map(({ player, clear }) => prisma.user.update({
        where: { id: player.user.id },
        data: { itemEffects: clear.itemEffects }
      })),
      ...candyEffectAssetOperations()
    ];
    if (operations.length > 1) await prisma.$transaction(operations);
    else await recordCreate;
    return;
  }
  const winner = room.game.winner.winnerColor === COLORS.black ? black : white;
  const loser = winner.color === COLORS.black ? white : black;
  const winnerBefore = { rating: winner.user.rating, coins: winner.user.coins };
  const loserBefore = { rating: loser.user.rating, coins: loser.user.coins };
  const winnerReward = resultRewardDelta(winner.color, room.game.winner.winnerColor);
  const loserReward = resultRewardDelta(loser.color, room.game.winner.winnerColor);
  applyResultRewardsToRoomUsers(winner, loser, winnerReward, loserReward, { mode });
  const recordCreate = createRecord();
  await prisma.$transaction([
    recordCreate,
    prisma.userModeStats.upsert(modeStatsUpsertOperation(winner, mode, {
      ratingDelta: winnerReward.rating,
      winsDelta: 1
    })),
    prisma.userModeStats.upsert(modeStatsUpsertOperation(loser, mode, {
      ratingDelta: loserReward.rating,
      lossesDelta: 1
    })),
    prisma.user.update({
      where: { id: winner.user.id },
      data: {
        ...(mode === "spark" ? {
          wins: { increment: 1 },
          rating: { increment: winnerReward.rating },
          rank: winner.user.rank
        } : {}),
        coins: { increment: winnerReward.coins },
        ...candyEffectData(winner, candyEffectUpdates)
      }
    }),
    prisma.user.update({
      where: { id: loser.user.id },
      data: {
        ...(mode === "spark" ? {
          losses: { increment: 1 },
          rating: { increment: loserReward.rating },
          rank: loser.user.rank
        } : {}),
        coins: { increment: loserReward.coins },
        ...candyEffectData(loser, candyEffectUpdates)
      }
    }),
    ...progressLedgerCreateOperations(prisma, [
      ...gameResultProgressEntries(winner, winnerBefore, room.code),
      ...gameResultProgressEntries(loser, loserBefore, room.code)
    ]),
    ...candyEffectAssetOperations()
  ]);
}

function applyDrawResultToRoomUser(player, mode) {
  const currentStats = modeStatsForUser(player.user, mode);
  player.user = {
    ...player.user,
    modeStats: {
      ...(player.user.modeStats ?? {}),
      [mode]: {
        ...currentStats,
        draws: Number(currentStats.draws ?? 0) + 1
      }
    }
  };
}

function modeStatsUpsertOperation(player, mode, { ratingDelta = 0, winsDelta = 0, lossesDelta = 0, drawsDelta = 0 } = {}) {
  return {
    where: {
      userId_mode: {
        userId: player.user.id,
        mode
      }
    },
    create: {
      userId: player.user.id,
      mode,
      rating: Number(player.user.modeStats?.[mode]?.rating ?? player.user.rating ?? 1000),
      rank: normalizeRank(player.user.modeStats?.[mode]?.rank ?? player.user.rank ?? DEFAULT_RANK),
      recentResults: serializeRecentResults(player.user.modeStats?.[mode]?.recentResults),
      wins: Math.max(0, Number(player.user.modeStats?.[mode]?.wins ?? player.user.wins ?? 0)),
      losses: Math.max(0, Number(player.user.modeStats?.[mode]?.losses ?? player.user.losses ?? 0)),
      draws: Math.max(0, Number(player.user.modeStats?.[mode]?.draws ?? 0))
    },
    update: {
      rating: { increment: ratingDelta },
      rank: normalizeRank(player.user.modeStats?.[mode]?.rank ?? player.user.rank ?? DEFAULT_RANK),
      recentResults: serializeRecentResults(player.user.modeStats?.[mode]?.recentResults),
      ...(winsDelta ? { wins: { increment: winsDelta } } : {}),
      ...(lossesDelta ? { losses: { increment: lossesDelta } } : {}),
      ...(drawsDelta ? { draws: { increment: drawsDelta } } : {})
    }
  };
}

function gameResultProgressEntries(player, before, roomCode) {
  return [
    {
      userId: player.user.id,
      metric: PROGRESS_METRICS.rating,
      delta: Number(player.user.rating ?? 0) - Number(before.rating ?? 0),
      beforeValue: before.rating,
      afterValue: player.user.rating,
      reason: PROGRESS_REASONS.gameResult,
      refType: "room",
      refId: roomCode
    },
    {
      userId: player.user.id,
      metric: PROGRESS_METRICS.coins,
      delta: Number(player.user.coins ?? 0) - Number(before.coins ?? 0),
      beforeValue: before.coins,
      afterValue: player.user.coins,
      reason: PROGRESS_REASONS.gameResult,
      refType: "room",
      refId: roomCode
    }
  ];
}
