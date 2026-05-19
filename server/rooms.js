import {
  COLORS,
  GAME_PHASES,
  activatePassiveSkill,
  createDrawResult,
  createGameState,
  createScoringState,
  createTimeoutResult,
  exposeHiddenHands,
  getPoint,
  gameViewForColor,
  markDeadGroup,
  opponent,
  parsePointId,
  passMove,
  playMove,
  prepareScoringState,
  randomLayout,
  resetDeadMarks,
  restoreSkillUse,
  restoreSuspendedHiddenHands,
  resignGame,
  scoreGame,
  suspendUnexposedHiddenHands,
  toggleNeutralPoint,
  useSkill
} from "../src/shared/game.js";
import { CHARACTERS } from "../src/shared/characters.js";
import { resultRewardDelta } from "../src/shared/resultRewards.js";
import { prisma } from "./db.js";
import { gameResultMetadata } from "./gameRecords.js";

const rooms = new Map();
let waitingPlayer = null;
const TEST_ACTIONS = new Set(["test-random-layout", "test-restore-skill"]);
const MATCH_SUCCESS_DELAY_MS = 3000;
const OPENING_NOTICE_DELAY_MS = 3000;
const INITIAL_PASSIVE_SKILL_DELAY_MS = 3000;

export function getRoom(roomCode) {
  return rooms.get(roomCode);
}

export function listActiveRooms() {
  return [...rooms.values()].filter((room) => room.game.phase !== GAME_PHASES.finished);
}

export function clearRoomsForTest() {
  for (const room of rooms.values()) {
    clearRoomTimers(room);
  }
  rooms.clear();
  waitingPlayer = null;
}

export function joinMatchmaking(player, io) {
  if (waitingPlayer && waitingPlayer.user.id !== player.user.id) {
    const first = waitingPlayer;
    waitingPlayer = null;
    const room = createRoom(first, player);
    rooms.set(room.code, room);
    startGameClock(room, io);
    scheduleGameStart(room, io);
    io.to(first.socketId).emit("match:found", roomView(room, first.user.id));
    io.to(player.socketId).emit("match:found", roomView(room, player.user.id));
    appendSystem(room, "匹配成功，3秒后进入空想对局。");
    broadcastRoom(io, room);
    return room;
  }
  waitingPlayer = player;
  return null;
}

export function leaveMatchmaking(userId) {
  if (waitingPlayer?.user.id === userId) waitingPlayer = null;
}

export function attachSocketToRoom(roomCode, socket, user) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  const player = room.players.find((p) => p.user.id === user.id);
  if (player) {
    player.socketId = socket.id;
  } else if (!room.spectators.some((p) => p.user.id === user.id)) {
    room.spectators.push({ user, socketId: socket.id });
    appendSystem(room, `${user.username}进入了观战席。`);
  }
  socket.join(roomCode);
  return room;
}

export function detachSocket(socketId) {
  if (waitingPlayer?.socketId === socketId) waitingPlayer = null;
  for (const room of rooms.values()) {
    room.spectators = room.spectators.filter((s) => s.socketId !== socketId);
  }
}

export function handleGameAction(roomCode, userId, action, io) {
  const room = rooms.get(roomCode);
  if (!room) return { ok: false, error: "房间不存在" };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "观战者不能操作棋局" };
  if (room.game.pendingSkill) return { ok: false, error: "技能演出中" };
  if (TEST_ACTIONS.has(action.type) && process.env.NODE_ENV === "production") {
    return { ok: false, error: "测试工具仅开发环境可用" };
  }

  if (action.type === "skill") {
    const skillConfig = player.character?.skill ?? player.characterId;
    const result = useSkill(room.game, player.color, skillConfig, action.pointId);
    if (!result.ok) return result;
    const skillNotice = describeSkillUse(room, player, action.pointId);

    const character = player.character ?? CHARACTERS[player.characterId] ?? CHARACTERS.sigrika;
    const skill = character.skill ?? CHARACTERS[player.characterId]?.skill ?? CHARACTERS.sigrika.skill;
    const pendingSkill = {
      id: crypto.randomUUID(),
      color: player.color,
      username: player.user.username,
      characterId: character.id ?? player.characterId,
      character: player.character ?? null,
      characterName: character.name,
      skillName: skill.name
    };
    room.game = {
      ...room.game,
      phase: GAME_PHASES.skillPreview,
      pendingSkill
    };
    appendSystem(room, skillNotice, { kind: "skill" });
    scheduleRoomTimeout(room, () => {
      const latest = rooms.get(roomCode);
      if (!latest || latest.game.pendingSkill?.id !== pendingSkill.id) return;
      result.state.pendingSkill = null;
      latest.game = result.state;
      resetByoYomi(player);
      appendNotices(latest, result.notices);
      if (latest.game.phase === GAME_PHASES.finished) scheduleRoomClose(roomCode, io);
      else maybeStartPassiveSkill(latest, io);
      broadcastRoom(io, latest);
    }, 2000);
    return { ok: true, room };
  }

  let result;
  if (action.type === "move") result = playMove(room.game, player.color, action.pointId);
  if (action.type === "pass") result = passMove(room.game, player.color);
  if (action.type === "resign") result = resignGame(room.game, player.color);
  if (action.type === "test-random-layout") result = randomLayout(room.game, { black: 50, white: 50 });
  if (action.type === "test-restore-skill") result = restoreSkillUse(room.game, player.color);
  if (!result) return { ok: false, error: "未知操作" };
  if (!result.ok) return result;

  room.game = result.state;
  appendNotices(room, result.notices);
  if (!action.type.startsWith("test-")) resetByoYomi(player);
  const label = player.color === COLORS.black ? "黑" : "白";
  if (action.type === "pass") appendSystem(room, `${label}方弃一手。`);
  if (action.type === "resign") appendSystem(room, `${label}方认输。`);
  if (action.type === "test-random-layout") appendSystem(room, "测试工具：已生成随机布局。");
  if (action.type === "test-restore-skill") appendSystem(room, `测试工具：${label}方已恢复技能次数。`);
  if (room.game.phase === GAME_PHASES.finished) {
    appendNotices(room, exposeHiddenHands(room.game));
    scheduleRoomClose(roomCode, io);
  } else {
    maybeStartPassiveSkill(room, io);
  }
  return { ok: true, room };
}

export function requestCounting(roomCode, userId, io) {
  const room = rooms.get(roomCode);
  if (!room) return { ok: false, error: "房间不存在" };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "观战者不能申请数子" };
  if (room.game.phase !== GAME_PHASES.playing) return { ok: false, error: "当前不能申请数子" };

  room.game.phase = GAME_PHASES.countingRequested;
  suspendUnexposedHiddenHands(room.game);
  room.game.scoring = prepareScoringState(room.game, createScoringState());
  room.game.scoring.requestedBy = userId;
  room.countingDeadline = Date.now() + 30000;
  appendSystem(room, `${player.user.username}申请数子。`);
  setTimeout(() => {
    const latest = rooms.get(roomCode);
    if (latest?.game.phase === GAME_PHASES.countingRequested && latest.countingDeadline && Date.now() >= latest.countingDeadline) {
      restoreSuspendedHiddenHands(latest.game);
      latest.game.phase = GAME_PHASES.playing;
      latest.game.scoring = null;
      latest.countingDeadline = null;
      appendSystem(latest, "数子申请超时，视为不同意数子。");
      broadcastRoom(io, latest);
    }
  }, 30000);
  return { ok: true, room };
}

export function respondCounting(roomCode, userId, accepted) {
  const room = rooms.get(roomCode);
  if (!room) return { ok: false, error: "房间不存在" };
  if (room.game.phase !== GAME_PHASES.countingRequested) return { ok: false, error: "当前没有数子申请" };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "观战者不能确认数子" };
  if (room.game.scoring?.requestedBy === userId) return { ok: false, error: "需要等待对方确认" };

  if (!accepted) {
    restoreSuspendedHiddenHands(room.game);
    room.game.phase = GAME_PHASES.playing;
    room.game.scoring = null;
    room.countingDeadline = null;
    appendSystem(room, "数子申请被拒绝，对局继续。");
    return { ok: true, room };
  }
  room.game.phase = GAME_PHASES.markingDead;
  room.game.scoring = prepareScoringState(room.game, room.game.scoring);
  room.game.scoring.acceptedBy = userId;
  room.countingDeadline = null;
  appendSystem(room, "双方同意数子，进入死子确认。");
  return { ok: true, room };
}

export function requestDraw(roomCode, userId, io) {
  const room = rooms.get(roomCode);
  if (!room) return { ok: false, error: "房间不存在" };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "观战者不能申请和棋" };
  if (room.game.phase !== GAME_PHASES.playing) return { ok: false, error: "当前不能申请和棋" };

  room.game.phase = GAME_PHASES.drawRequested;
  room.game.drawRequest = {
    requestedBy: userId,
    requestedColor: player.color
  };
  room.drawDeadline = Date.now() + 10000;
  appendSystem(room, `${player.user.username}申请和棋。`);
  setTimeout(() => {
    const latest = rooms.get(roomCode);
    if (latest?.game.phase === GAME_PHASES.drawRequested && latest.drawDeadline && Date.now() >= latest.drawDeadline) {
      latest.game.phase = GAME_PHASES.playing;
      latest.game.drawRequest = null;
      latest.drawDeadline = null;
      appendSystem(latest, "和棋申请超时，对局继续。");
      broadcastRoom(io, latest);
    }
  }, 10000);
  return { ok: true, room };
}

export function respondDraw(roomCode, userId, accepted, io) {
  const room = rooms.get(roomCode);
  if (!room) return { ok: false, error: "房间不存在" };
  if (room.game.phase !== GAME_PHASES.drawRequested) return { ok: false, error: "当前没有和棋申请" };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "观战者不能确认和棋" };
  if (room.game.drawRequest?.requestedBy === userId) return { ok: false, error: "需要等待对方确认" };

  if (!accepted) {
    room.game.phase = GAME_PHASES.playing;
    room.game.drawRequest = null;
    room.drawDeadline = null;
    appendSystem(room, `${player.user.username}不同意和棋，对局继续。`);
    return { ok: true, room };
  }

  room.game.phase = GAME_PHASES.finished;
  room.game.drawRequest = null;
  room.game.winner = createDrawResult("agreement");
  room.drawDeadline = null;
  appendSystem(room, "双方同意和棋，对局结束。");
  scheduleRoomClose(roomCode, io);
  return { ok: true, room };
}

export function handleScoringAction(roomCode, userId, action, io) {
  const room = rooms.get(roomCode);
  if (!room) return { ok: false, error: "房间不存在" };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "观战者不能确认数子" };

  if (["mark-dead", "mark-neutral", "reset-dead", "confirm-dead"].includes(action.type)) {
    if (room.game.phase !== GAME_PHASES.markingDead) return { ok: false, error: "当前不在死子确认阶段" };
  }
  if (["accept-result", "reject-result"].includes(action.type)) {
    if (room.game.phase !== GAME_PHASES.resultReview) return { ok: false, error: "当前不在结果确认阶段" };
  }

  let result = { ok: true, state: room.game };
  if (action.type === "mark-dead") result = markDeadGroup(room.game, action.pointId, player.color);
  if (action.type === "mark-neutral") result = toggleNeutralPoint(room.game, action.pointId);
  if (action.type === "reset-dead") result = resetDeadMarks(room.game);
  if (!result.ok) return result;
  room.game = result.state;

  if (action.type === "reset-dead") appendSystem(room, `${player.user.username}重新确认死子。`);

  if (action.type === "confirm-dead") {
    const confirmed = new Set(room.game.scoring.confirmedBy);
    confirmed.add(userId);
    room.game.scoring.confirmedBy = [...confirmed];
    appendSystem(room, `${player.user.username}确认死子。`);
    if (room.game.scoring.confirmedBy.length === 2) {
      const score = scoreGame(room.game);
      room.game.phase = GAME_PHASES.resultReview;
      room.game.scoring.result = score;
      room.game.scoring.resultDeadline = Date.now() + 30000;
      appendSystem(room, `数子结果：${score.text}。`);
      scheduleResultReviewTimeout(roomCode, io);
    }
  }

  if (action.type === "accept-result") {
    const accepted = new Set(room.game.scoring.resultAcceptedBy);
    accepted.add(userId);
    room.game.scoring.resultAcceptedBy = [...accepted];
    if (room.game.scoring.resultAcceptedBy.length === 2) {
      room.game.phase = GAME_PHASES.finished;
      room.game.winner = room.game.scoring.result;
      appendNotices(room, exposeHiddenHands(room.game));
      appendSystem(room, `对局结束，${room.game.scoring.result.text}。`);
      scheduleRoomClose(roomCode, io);
    }
  }

  if (action.type === "reject-result") {
    restoreSuspendedHiddenHands(room.game);
    room.game.phase = GAME_PHASES.playing;
    room.game.scoring = null;
    appendSystem(room, `${player.user.username}不同意结果，对局继续。`);
  }

  return { ok: true, room };
}

export function addChat(roomCode, user, text) {
  const room = rooms.get(roomCode);
  if (!room || !text?.trim()) return null;
  room.chat.push({
    id: crypto.randomUUID(),
    type: "chat",
    userId: user.id,
    username: user.username,
    moveNumber: room.game.moveNumber,
    text: text.trim().slice(0, 240),
    createdAt: Date.now()
  });
  return room;
}

export function broadcastRoom(io, room) {
  for (const player of room.players) {
    io.to(player.socketId).emit("room:update", roomView(room, player.user.id));
  }
  for (const spectator of room.spectators) {
    io.to(spectator.socketId).emit("room:update", roomView(room, spectator.user.id));
  }
}

export function roomView(room, viewerId) {
  const playerColor = room.players.find((p) => p.user.id === viewerId)?.color ?? null;
  const viewerColor = playerColor ?? COLORS.black;
  const role = room.players.some((p) => p.user.id === viewerId) ? "player" : "spectator";
  const view = {
    black: gameViewFor(room.game, COLORS.black),
    white: gameViewFor(room.game, COLORS.white)
  };
  return {
    code: room.code,
    viewerId,
    role,
    players: room.players.map((p) => ({
      user: p.user,
      color: p.color,
      characterId: p.characterId,
      character: p.character,
      captures: room.game.captures[p.color],
      time: p.time
    })),
    spectators: room.spectators.length,
    game: role === "spectator" ? view.black : view[viewerColor],
    gameViews: role === "spectator" ? view : null,
    chat: room.chat,
    openingEndsAt: room.openingEndsAt,
    closesAt: room.closesAt,
    countingDeadline: room.countingDeadline,
    drawDeadline: room.drawDeadline,
    resultDeadline: room.game.scoring?.resultDeadline ?? null
  };
}

function gameViewFor(game, viewerColor) {
  return gameViewForColor(game, viewerColor);
}

function createRoom(first, second) {
  const blackFirst = Math.random() >= 0.5;
  const players = [
    toRoomPlayer(blackFirst ? first : second, COLORS.black),
    toRoomPlayer(blackFirst ? second : first, COLORS.white)
  ];
  const createdAt = Date.now();
  const game = createGameState(players.map((p) => ({
    userId: p.user.id,
    color: p.color,
    characterId: p.characterId,
    character: p.character
  })));
  game.phase = GAME_PHASES.opening;
  return {
    code: randomRoomCode(),
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

function toRoomPlayer(player, color) {
  return {
    user: player.user,
    socketId: player.socketId,
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
  const pendingSkill = {
    id: crypto.randomUUID(),
    color: player.color,
    username: player.user.username,
    characterId: player.character?.id ?? player.characterId,
    character: player.character ?? null,
    characterName: player.character?.name ?? CHARACTERS[player.characterId]?.name,
    skillName: skill.name
  };
  room.game = {
    ...room.game,
    phase: GAME_PHASES.skillPreview,
    pendingSkill
  };
  appendSystem(room, describeSkillUse(room, player, null), { kind: "skill" });
  scheduleRoomTimeout(room, () => {
    const latest = rooms.get(room.code);
    if (!latest || latest.game.pendingSkill?.id !== pendingSkill.id) return;
    const result = activatePassiveSkill(latest.game, player.color, skill);
    if (!result.ok) return;
    latest.game = result.state;
    broadcastRoom(io, latest);
  }, 2000);
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

export function startInitialPassiveSkillNow(room, io) {
  return maybeStartPassiveSkill(room, io);
}

function scheduleRoomTimeout(room, callback, delay) {
  const id = setTimeout(() => {
    room.timeoutIds = (room.timeoutIds ?? []).filter((candidate) => candidate !== id);
    callback();
  }, delay);
  room.timeoutIds ??= [];
  room.timeoutIds.push(id);
  return id;
}

export function clearRoomTimers(room) {
  if (room.timerId) clearInterval(room.timerId);
  for (const id of room.timeoutIds ?? []) {
    clearTimeout(id);
  }
  room.timeoutIds = [];
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
  room.timerId = setInterval(() => {
    if (!rooms.has(room.code)) {
      clearInterval(room.timerId);
      return;
    }
    if (room.game.phase !== GAME_PHASES.playing) {
      room.lastTick = Date.now();
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
      room.game.winner = createTimeoutResult(active.color);
      appendSystem(room, `${active.user.username}超时，对局结束。`);
      scheduleRoomClose(room.code, io);
    }
    broadcastRoom(io, room);
  }, 1000);
}

function tickPlayerClock(player, elapsed) {
  let remaining = elapsed;
  if (player.time.main > 0) {
    const used = Math.min(player.time.main, remaining);
    player.time.main -= used;
    remaining -= used;
  }
  while (remaining > 0 && player.time.main <= 0 && player.time.periods > 0) {
    const used = Math.min(player.time.periodRemaining, remaining);
    player.time.periodRemaining -= used;
    remaining -= used;
    if (player.time.periodRemaining <= 0) {
      player.time.periods -= 1;
      player.time.periodRemaining = player.time.byoYomi;
    }
  }
}

function resetByoYomi(player) {
  if (player.time.main <= 0 && player.time.periods > 0) {
    player.time.periodRemaining = player.time.byoYomi;
  }
}

function scheduleResultReviewTimeout(roomCode, io) {
  setTimeout(() => {
    const latest = rooms.get(roomCode);
    const deadline = latest?.game.scoring?.resultDeadline;
    if (latest?.game.phase === GAME_PHASES.resultReview && deadline && Date.now() >= deadline) {
      latest.game.phase = GAME_PHASES.playing;
      latest.game.scoring = null;
      appendSystem(latest, "数子结果确认超时，对局继续。");
      broadcastRoom(io, latest);
    }
  }, 30000);
}

function scheduleRoomClose(roomCode, io) {
  const room = rooms.get(roomCode);
  if (!room || room.closesAt) return;
  saveGameRecord(room).catch((error) => {
    console.error("Failed to save game record", error);
  });
  room.closesAt = Date.now() + 5 * 60 * 1000;
  setTimeout(() => {
    const latest = rooms.get(roomCode);
    if (latest?.timerId) clearInterval(latest.timerId);
    io.to(roomCode).emit("room:closed");
    rooms.delete(roomCode);
  }, 5 * 60 * 1000);
}

async function saveGameRecord(room) {
  if (room.recordSaved || room.game.phase !== GAME_PHASES.finished) return;
  const black = room.players.find((player) => player.color === COLORS.black);
  const white = room.players.find((player) => player.color === COLORS.white);
  if (!black || !white) return;
  room.recordSaved = true;
  const resultMetadata = gameResultMetadata(room.game.winner);
  const recordCreate = prisma.gameRecord.create({
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
      snapshot: JSON.stringify(roomView(room, black.user.id)),
      snapshotVersion: 1
    }
  });
  if (![COLORS.black, COLORS.white].includes(room.game.winner?.winnerColor)) {
    await recordCreate;
    return;
  }
  const winner = room.game.winner.winnerColor === COLORS.black ? black : white;
  const loser = winner.color === COLORS.black ? white : black;
  const winnerReward = resultRewardDelta(winner.color, room.game.winner.winnerColor);
  const loserReward = resultRewardDelta(loser.color, room.game.winner.winnerColor);
  await prisma.$transaction([
    recordCreate,
    prisma.user.update({
      where: { id: winner.user.id },
      data: {
        wins: { increment: 1 },
        rating: { increment: winnerReward.rating },
        coins: { increment: winnerReward.coins }
      }
    }),
    prisma.user.update({
      where: { id: loser.user.id },
      data: {
        losses: { increment: 1 },
        rating: { increment: loserReward.rating },
        coins: { increment: loserReward.coins }
      }
    })
  ]);
}
