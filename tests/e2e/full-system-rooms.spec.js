import { randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import { legalPracticeGtpVertices, gtpVertexToPointId } from "../../src/shared/practiceBotPosition.js";
import { connectSocket, createPreparedRoom, socketForColor,
  waitForRoomPhase, waitForSocketEvent } from "../stability/helpers.js";
import { test, api, newPlayer, openTestDatabase, emitAck, freshUser } from "./full-system-helpers.js";

let db;
test.beforeAll(() => { db = openTestDatabase(); });
test.afterAll(async () => { await db?.$disconnect(); });

async function action(socket, code, input, actionId = randomUUID()) {
  return emitAck(socket, "game:action", { roomCode: code, action: input, actionId });
}

// Finished rooms resume through room:resume { type: "result" }; active rooms
// resume through room:update. Listen to both before issuing the request.
function requestRoomSnapshot(socket, roomCode) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      socket.off("room:update", update);
      socket.off("room:resume", resume);
    };
    const update = (room) => { if (room?.code === roomCode) { cleanup(); resolve(room); } };
    const resume = (payload) => update(payload?.room);
    const timer = setTimeout(() => { cleanup(); reject(new Error("Room snapshot timeout")); }, 5000);
    socket.on("room:update", update);
    socket.on("room:resume", resume);
    socket.emit("room:resume", { roomCode });
  });
}

async function playLegal(pairs, room) {
  const pointId = gtpVertexToPointId(legalPracticeGtpVertices(room.game, room.game.turn)[0], room.game.size);
  expect(pointId).toBeTruthy();
  const result = await action(socketForColor(room, pairs, room.game.turn), room.code, { type: "move", pointId });
  expect(result.ok, result.error).toBe(true);
  return requestRoomSnapshot(pairs[0].socket, room.code);
}

async function persisted(request, auth, code, mode) {
  await expect.poll(() => db.gameRecord.count({ where: { roomCode: code } })).toBe(1);
  const record = await db.gameRecord.findFirst({ where: { roomCode: code } });
  expect(record.settlementId).toBeTruthy();
  const list = await api(request, auth, "GET", `/api/replays?mode=${mode}`);
  expect(list.records.some((entry) => entry.id === record.id)).toBe(true);
  const detail = await api(request, auth, "GET", `/api/replays/${record.id}`);
  expect(detail.record.snapshot.game.phase).toBe("finished");
  return record;
}

for (const mode of ["standard", "gomoku", "team"]) {
  test(`${mode} real matchmaking, legal moves, settlement, replay and mode statistics`, async ({ request, baseURL }) => {
    test.setTimeout(100_000);
    const users = await Promise.all([1, 2].map(() => newPlayer(request, db, { ownedCharacters: "sigrika,denia,aemeath" })));
    const pairs = await Promise.all(users.map(async (auth) => ({ auth, socket: await connectSocket(baseURL, auth.token) })));
    try {
      let room;
      if (mode === "team") {
        const found = waitForSocketEvent(pairs[0].socket, "match:found");
        for (const { socket } of pairs) {
          const result = await emitAck(socket, "match:join", { mode, lineup: ["sigrika", "denia", "aemeath"] });
          expect(result.ok, result.error).toBe(true);
        }
        room = await found;
        for (const { socket } of pairs) await emitAck(socket, "room:preload-ready", { roomCode: room.code });
        room = await waitForRoomPhase(pairs[0].socket, room.code, "playing");
      } else ({ room } = await createPreparedRoom(pairs[0].socket, pairs[1].socket, { mode }));
      expect(room.mode).toBe(mode);
      const occupied = await emitAck(pairs[0].socket, "match:join", { mode: "spark" });
      expect(occupied.ok).toBe(false);
      expect(occupied.code).toBe("active_room_exists");
      if (mode === "gomoku") {
        expect((await action(socketForColor(room, pairs, "black"), room.code, { type: "pass" })).ok).toBe(false);
        for (let x = 0; x < 5; x += 1) {
          expect((await action(socketForColor(room, pairs, "black"), room.code, { type: "move", pointId: `${x},0` })).ok).toBe(true);
          if (x < 4) expect((await action(socketForColor(room, pairs, "white"), room.code, { type: "move", pointId: `${x},10` })).ok).toBe(true);
        }
      } else {
        const target = mode === "team" ? 81 : 11;
        while (room.game.moveNumber < target) {
          room = await playLegal(pairs, room);
          if (room.game.phase === "opening") room = await waitForRoomPhase(pairs[0].socket, room.code, "playing");
        }
        if (mode === "standard") {
          expect(room.game.size).toBe(19);
          expect((await action(socketForColor(room, pairs, room.game.turn), room.code, { type: "skill", pointId: "6,6" })).ok).toBe(false);
        } else {
          expect(room.team.round).toBe(3);
          expect(room.players.every((player) => player.characterId === "aemeath")).toBe(true);
        }
        expect((await action(pairs[1].socket, room.code, { type: "resign" })).ok).toBe(true);
      }
      room = await requestRoomSnapshot(pairs[0].socket, room.code);
      expect(room.game.phase).toBe("finished");
      expect(room.game.winner.invalid).not.toBe(true);
      const record = await persisted(request, pairs[0].auth, room.code, mode);
      expect(record.rated).toBe(mode !== "team");
      for (const { auth } of pairs) {
        const stats = await db.userModeStats.findUnique({ where: { userId_mode: { userId: auth.user.id, mode } } });
        if (mode === "team") {
          expect(stats).toBeNull();
          expect((await freshUser(request, auth)).coins).toBe(2000);
        } else expect(stats.wins + stats.losses + stats.draws).toBe(1);
      }
      await requestRoomSnapshot(pairs[0].socket, room.code);
      expect(await db.gameRecord.count({ where: { roomCode: room.code } })).toBe(1);
    } finally { pairs.forEach(({ socket }) => socket.disconnect()); }
  });
}

test("spectators cannot move, action retries are idempotent, and a reconnect resumes the same game", async ({ request, baseURL }) => {
  test.setTimeout(45_000);
  const users = await Promise.all([1, 2, 3].map(() => newPlayer(request, db)));
  const pairs = await Promise.all(users.map(async (auth) => ({ auth, socket: await connectSocket(baseURL, auth.token) })));
  try {
    let { room } = await createPreparedRoom(pairs[0].socket, pairs[1].socket);
    const spectator = waitForSocketEvent(pairs[2].socket, "room:update", (view) => view.code === room.code);
    pairs[2].socket.emit("room:join", { roomCode: room.code });
    expect((await spectator).role).toBe("spectator");
    expect((await action(pairs[2].socket, room.code, { type: "move", pointId: "0,0" })).ok).toBe(false);
    const black = socketForColor(room, pairs, "black");
    const id = randomUUID();
    const first = await action(black, room.code, { type: "move", pointId: "0,0" }, id);
    expect(first.ok).toBe(true);
    expect(await action(black, room.code, { type: "move", pointId: "0,0" }, id)).toEqual(first);
    room = await requestRoomSnapshot(black, room.code);
    expect(room.game.moveNumber).toBe(1);
    pairs[0].socket.disconnect();
    pairs[0].socket = await connectSocket(baseURL, pairs[0].auth.token);
    room = await requestRoomSnapshot(pairs[0].socket, room.code);
    expect(room.role).toBe("player");
    expect(room.game.moveNumber).toBe(1);
    while (room.game.moveNumber < 11) room = await playLegal(pairs, room);
    expect((await action(pairs[1].socket, room.code, { type: "resign" })).ok).toBe(true);
    await persisted(request, pairs[0].auth, room.code, "spark");
  } finally { pairs.forEach(({ socket }) => socket.disconnect()); }
});

async function eventRoom(socket, roomCode, event, payload, phase, predicate = () => true) {
  const updated = waitForSocketEvent(socket, "room:update", (room) => room.code === roomCode && room.game.phase === phase && predicate(room));
  socket.emit(event, { roomCode, ...payload });
  return updated;
}

for (const ending of ["counting", "draw"]) {
  test(`real ${ending} rejection, mutual confirmation and valid settlement`, async ({ request, baseURL }) => {
    test.setTimeout(60_000);
    const users = await Promise.all([1, 2].map(() => newPlayer(request, db)));
    const pairs = await Promise.all(users.map(async (auth) => ({ auth, socket: await connectSocket(baseURL, auth.token) })));
    try {
      let { room } = await createPreparedRoom(pairs[0].socket, pairs[1].socket);
      while (room.game.moveNumber < 11) room = await playLegal(pairs, room);
      const [first, second] = pairs.map(({ socket }) => socket);
      const requested = ending === "counting" ? "counting-requested" : "draw-requested";
      await eventRoom(first, room.code, `${ending}:request`, {}, requested);
      await eventRoom(second, room.code, `${ending}:respond`, { accepted: false }, "playing");
      await eventRoom(first, room.code, `${ending}:request`, {}, requested);
      if (ending === "counting") {
        await eventRoom(second, room.code, "counting:respond", { accepted: true }, "marking-dead");
        room = await eventRoom(first, room.code, "scoring:action", { action: { type: "confirm-dead" } }, "marking-dead",
          (view) => view.game.scoring.confirmedBy.includes(users[0].user.id));
        expect(room.game.scoring.confirmedBy).toEqual([users[0].user.id]);
        await eventRoom(second, room.code, "scoring:action", { action: { type: "confirm-dead" } }, "result-review");
        room = await eventRoom(first, room.code, "scoring:action", { action: { type: "accept-result" } }, "result-review",
          (view) => view.game.scoring.resultAcceptedBy.includes(users[0].user.id));
        expect(room.game.scoring.resultAcceptedBy).toEqual([users[0].user.id]);
        room = await eventRoom(second, room.code, "scoring:action", { action: { type: "accept-result" } }, "finished");
      } else room = await eventRoom(second, room.code, "draw:respond", { accepted: true }, "finished");
      expect(room.game.winner.invalid).not.toBe(true);
      room = await requestRoomSnapshot(first, room.code);
      expect(room.game.phase).toBe("finished");
      const record = await persisted(request, users[0], room.code, "spark");
      if (ending === "draw") {
        expect(record.winnerColor).toBeNull();
        expect(record.resultReason).toBe("agreement");
      } else expect(["black", "white"]).toContain(record.winnerColor);
      for (const { user } of users) {
        const stats = await db.userModeStats.findUnique({ where: { userId_mode: { userId: user.id, mode: "spark" } } });
        expect(stats.wins + stats.losses + stats.draws).toBe(1);
        if (ending === "draw") expect(stats.draws).toBe(1);
        else {
          const color = room.players.find((player) => player.user.id === user.id).color;
          expect(stats[color === record.winnerColor ? "wins" : "losses"]).toBe(1);
        }
      }
    } finally { pairs.forEach(({ socket }) => socket.disconnect()); }
  });
}
