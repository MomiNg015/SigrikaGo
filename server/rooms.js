import {
  COLORS,
  createGameState,
  createScoringState,
  getPoint,
  markDeadGroup,
  opponent,
  parsePointId,
  passMove,
  playMove,
  prepareScoringState,
  resetDeadMarks,
  resignGame,
  scoreGame,
  toggleNeutralPoint,
  useSkill
} from "../src/shared/game.js";
import { CHARACTERS } from "../src/shared/characters.js";
import { prisma } from "./db.js";

const rooms = new Map();
let waitingPlayer = null;

export function getRoom(roomCode) {
  return rooms.get(roomCode);
}

export function listActiveRooms() {
  return [...rooms.values()].filter((room) => room.game.phase !== "finished");
}

export function joinMatchmaking(player, io) {
  if (waitingPlayer && waitingPlayer.user.id !== player.user.id) {
    const first = waitingPlayer;
    waitingPlayer = null;
    const room = createRoom(first, player);
    rooms.set(room.code, room);
    startGameClock(room, io);
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

  let result;
  let skillNotice = null;
  if (action.type === "move") result = playMove(room.game, player.color, action.pointId);
  if (action.type === "pass") result = passMove(room.game, player.color);
  if (action.type === "resign") result = resignGame(room.game, player.color);
  if (action.type === "skill") {
    skillNotice = describeSkillUse(room, player, action.pointId);
    result = useSkill(room.game, player.color, player.characterId, action.pointId);
  }
  if (!result) return { ok: false, error: "未知操作" };
  if (!result.ok) return result;

  room.game = result.state;
  resetByoYomi(player);
  const label = player.color === COLORS.black ? "黑" : "白";
  if (action.type === "pass") appendSystem(room, `${label}方弃一手。`);
  if (action.type === "resign") appendSystem(room, `${label}方认输。`);
  if (action.type === "skill") {
    appendSystem(room, skillNotice, { kind: "skill" });
  }
  if (room.game.phase === "finished") scheduleRoomClose(roomCode, io);
  return { ok: true, room };
}

export function requestCounting(roomCode, userId, io) {
  const room = rooms.get(roomCode);
  if (!room) return { ok: false, error: "房间不存在" };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "观战者不能申请数子" };
  if (room.game.phase !== "playing") return { ok: false, error: "当前不能申请数子" };

  room.game.phase = "counting-requested";
  room.game.scoring = prepareScoringState(room.game, createScoringState());
  room.game.scoring.requestedBy = userId;
  room.countingDeadline = Date.now() + 30000;
  appendSystem(room, `${player.user.username}申请数子。`);
  setTimeout(() => {
    const latest = rooms.get(roomCode);
    if (latest?.game.phase === "counting-requested" && latest.countingDeadline && Date.now() >= latest.countingDeadline) {
      latest.game.phase = "playing";
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
  if (room.game.phase !== "counting-requested") return { ok: false, error: "当前没有数子申请" };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "观战者不能确认数子" };
  if (room.game.scoring?.requestedBy === userId) return { ok: false, error: "需要等待对方确认" };

  if (!accepted) {
    room.game.phase = "playing";
    room.game.scoring = null;
    room.countingDeadline = null;
    appendSystem(room, "数子申请被拒绝，对局继续。");
    return { ok: true, room };
  }
  room.game.phase = "marking-dead";
  room.game.scoring = prepareScoringState(room.game, room.game.scoring);
  room.game.scoring.acceptedBy = userId;
  room.countingDeadline = null;
  appendSystem(room, "双方同意数子，进入死子确认。");
  return { ok: true, room };
}

export function handleScoringAction(roomCode, userId, action, io) {
  const room = rooms.get(roomCode);
  if (!room) return { ok: false, error: "房间不存在" };
  const player = room.players.find((p) => p.user.id === userId);
  if (!player) return { ok: false, error: "观战者不能确认数子" };

  if (["mark-dead", "mark-neutral", "reset-dead", "confirm-dead"].includes(action.type)) {
    if (room.game.phase !== "marking-dead") return { ok: false, error: "当前不在死子确认阶段" };
  }
  if (["accept-result", "reject-result"].includes(action.type)) {
    if (room.game.phase !== "result-review") return { ok: false, error: "当前不在结果确认阶段" };
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
      room.game.phase = "result-review";
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
      room.game.phase = "finished";
      room.game.winner = room.game.scoring.result;
      appendSystem(room, `对局结束，${room.game.scoring.result.text}。`);
      scheduleRoomClose(roomCode, io);
    }
  }

  if (action.type === "reject-result") {
    room.game.phase = "playing";
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
  return {
    code: room.code,
    viewerId,
    role: room.players.some((p) => p.user.id === viewerId) ? "player" : "spectator",
    players: room.players.map((p) => ({
      user: p.user,
      color: p.color,
      characterId: p.characterId,
      captures: room.game.captures[p.color],
      time: p.time
    })),
    spectators: room.spectators.length,
    game: room.game,
    chat: room.chat,
    closesAt: room.closesAt,
    countingDeadline: room.countingDeadline,
    resultDeadline: room.game.scoring?.resultDeadline ?? null
  };
}

function createRoom(first, second) {
  const blackFirst = Math.random() >= 0.5;
  const players = [
    toRoomPlayer(blackFirst ? first : second, COLORS.black),
    toRoomPlayer(blackFirst ? second : first, COLORS.white)
  ];
  return {
    code: randomRoomCode(),
    players,
    spectators: [],
    game: createGameState(players.map((p) => ({
      userId: p.user.id,
      color: p.color,
      characterId: p.characterId
    }))),
    chat: [],
    createdAt: Date.now(),
    closesAt: null,
    countingDeadline: null,
    timerId: null,
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

function describeSkillUse(room, player, targetId) {
  const character = CHARACTERS[player.characterId];
  const colorLabel = player.color === COLORS.black ? "黑" : "白";
  const fixed = `${colorLabel}方${player.user.username}使用了${character.name}的“${character.skill.name}”技能`;
  const coord = formatPointLabel(targetId);
  if (player.characterId === "sigrika") {
    return `${fixed}。从天而降破坏了${coord}的点位，铛！`;
  }
  if (player.characterId === "danea") {
    const point = getPoint(room.game, targetId);
    const from = stoneLabel(point?.stone);
    const to = stoneLabel(point?.stone ? opponent(point.stone) : null);
    return `${fixed}。诅咒了${coord}的${from}，将其从${from}变成了${to}。`;
  }
  return `${fixed}。`;
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
    if (room.game.phase !== "playing") {
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
      room.game.phase = "finished";
      room.game.winner = {
        winnerColor: active.color === COLORS.black ? COLORS.white : COLORS.black,
        reason: "timeout",
        text: `${active.color === COLORS.black ? "黑" : "白"}方超时`
      };
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
    if (latest?.game.phase === "result-review" && deadline && Date.now() >= deadline) {
      latest.game.phase = "playing";
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
  if (room.recordSaved || room.game.phase !== "finished") return;
  const black = room.players.find((player) => player.color === COLORS.black);
  const white = room.players.find((player) => player.color === COLORS.white);
  if (!black || !white) return;
  room.recordSaved = true;
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
      moveCount: room.game.moveNumber,
      snapshot: JSON.stringify(roomView(room, black.user.id))
    }
  });
  if (![COLORS.black, COLORS.white].includes(room.game.winner?.winnerColor)) {
    await recordCreate;
    return;
  }
  const winner = room.game.winner.winnerColor === COLORS.black ? black : white;
  const loser = winner.color === COLORS.black ? white : black;
  await prisma.$transaction([
    recordCreate,
    prisma.user.update({
      where: { id: winner.user.id },
      data: {
        wins: { increment: 1 },
        rating: { increment: 20 }
      }
    }),
    prisma.user.update({
      where: { id: loser.user.id },
      data: {
        losses: { increment: 1 }
      }
    })
  ]);
}
