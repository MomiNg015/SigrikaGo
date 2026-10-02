import { describe, expect, it, vi } from "vitest";
import { createPracticeRoom, createSigrikaCandyDuelRoom } from "./roomFactory.js";
import { createLocalPracticeEngine } from "./localPracticeEngine.js";
import { applyStandardGameAction } from "./roomGameActions.js";
import { gameViewForColor, getPoint } from "../src/shared/game.js";
import { LOCAL_PRACTICE_VERSION, LOCAL_PRACTICE_LEASE_MS } from "../src/shared/localPractice.js";
import { roomPersistenceSnapshot, hydratePersistedRoom } from "./roomStatePersistence.js";
import { practiceBotView } from "./practiceBotView.js";

function fixture(options = {}) {
  const socket = { id: "socket-1", user: { id: "human" } };
  const room = createPracticeRoom({ user: { id: "human", username: "test" }, socketId: socket.id },
    { difficulty: "advanced", playerColor: "white", engineBackend: "browser", ...options });
  room.game.phase = "playing";
  room.game.turn = room.practice.botColor;
  let clock = 1000;
  let nextId = 0;
  const rooms = new Map([[room.code, room]]);
  const broadcastRoom = vi.fn();
  const handleGameAction = vi.fn((_code, userId, action) => applyStandardGameAction({ room,
    player: room.players.find((p) => p.user.id === userId), action, io: {},
    appendSystem: vi.fn(), appendNotices: vi.fn(), broadcastToast: vi.fn(),
    resetByoYomi: vi.fn(), scheduleRoomClose: vi.fn(), maybeStartPassiveSkill: vi.fn() }));
  const engine = createLocalPracticeEngine({ getRoom: (code) => rooms.get(code), handleGameAction, broadcastRoom,
    now: () => clock, id: () => `job-${++nextId}` });
  const request = (owner = socket, extra = {}) => engine.request(owner, { roomCode: room.code, version: LOCAL_PRACTICE_VERSION, ...extra });
  const submit = (job, action = { type: "move", pointId: "3,3" }, owner = socket) => engine.submit(owner,
    { roomCode: room.code, jobId: job.id, positionVersion: job.positionVersion, action }, {});
  return { engine, room, socket, request, submit, rooms, handleGameAction, broadcastRoom,
    advance: (ms = 2000) => { clock += ms; } };
}

describe("local practice authority", () => {
  it.each(["beginner", "intermediate", "advanced"])("ignores Nabomo color illusions for %s without changing the human view", (difficulty) => {
    const f = fixture({ difficulty });
    const stone = getPoint(f.room.game, "1,1");
    stone.stone = "white";
    stone.colorIllusion = { owner: "white", visibleAs: "black" };
    const before = structuredClone(f.room.game);
    const { job } = f.request();
    if (difficulty === "beginner") {
      expect(getPoint(job.view, "1,1").stone).toBe("white");
      expect(getPoint(job.view, "1,1").colorIllusion).toBeNull();
    } else {
      expect(job.sgf).toContain("AW[bb]");
      expect(job.sgf).not.toContain("AB[bb]");
    }
    expect(getPoint(gameViewForColor(f.room.game, "black"), "1,1").stone).toBe("black");
    expect(f.room.game).toEqual(before);
  });
  it("reuses the current lease and applies a reply exactly once through the formal action path", () => {
    const f = fixture();
    const { job } = f.request();
    expect(f.request().job.id).toBe(job.id);
    expect(f.submit(job).code).toBe("local_practice_wait");
    f.advance();
    expect(f.submit(job)).toEqual({ ok: true });
    expect(f.submit(job)).toEqual({ ok: true, duplicate: true });
    expect(f.handleGameAction).toHaveBeenCalledTimes(1);
    expect(getPoint(f.room.game, "3,3").stone).toBe("black");
    expect(f.room.game.moveNumber).toBe(1);
    expect(f.request()).toEqual({ ok: true, job: null });
  });

  it("uses bot-visible SGF and rejects non-whitelisted points, skills and client-supplied scores", () => {
    const f = fixture({ challenge: "capture-challenge" });
    const hidden = getPoint(f.room.game, "1,1");
    hidden.stone = "white";
    hidden.hiddenHand = { owner: "white", exposed: false };
    getPoint(f.room.game, "2,2").valid = false;
    const { job } = f.request();
    expect(job.sgf).not.toContain("AW[bb]");
    expect(job.legalVertices).not.toContain("C11");
    expect(job).not.toHaveProperty("view");
    f.advance();
    expect(f.submit(job, { type: "skill" }).code).toBe("local_practice_invalid");
    expect(f.submit(job, { type: "move", pointId: "2,2", captures: 999 }).code).toBe("local_practice_invalid");
    expect(f.room.game.captures.white).toBe(0);
    expect(f.handleGameAction).not.toHaveBeenCalled();
  });

  it("sends the projected rule state only for the beginner heuristic", () => {
    const f = fixture({ difficulty: "beginner" });
    expect(f.request().job.view).toEqual(practiceBotView(f.room.game, f.room.practice.botColor));
    expect(f.request().job).not.toHaveProperty("sgf");
  });

  it("invalidates board changes even when moveNumber does not change", () => {
    const f = fixture();
    const { job } = f.request();
    getPoint(f.room.game, "4,4").valid = false;
    f.advance();
    expect(f.submit(job).code).toBe("local_practice_stale");
    const replacement = f.request().job;
    expect(replacement.id).not.toBe(job.id);
    expect(replacement.positionVersion).not.toBe(job.positionVersion);
  });

  it("expires leases and fences former connections, spectators and other users", () => {
    const f = fixture();
    const { job } = f.request();
    expect(f.request({ id: "spectator", user: { id: "else" } }).code).toBe("local_practice_forbidden");
    f.advance(LOCAL_PRACTICE_LEASE_MS);
    expect(f.submit(job).code).toBe("local_practice_stale");
    const newer = f.request().job;
    f.room.players.find((p) => p.user.id === "human").socketId = "socket-2";
    expect(f.submit(newer).code).toBe("local_practice_forbidden");
    const newSocket = { ...f.socket, id: "socket-2" };
    expect(f.request(newSocket).job.id).not.toBe(newer.id);
    expect(f.submit(newer, { type: "pass" }, newSocket).code).toBe("local_practice_stale");
  });

  it("pauses and revokes the job on backgrounding, resuming from current state", () => {
    const f = fixture();
    const { job } = f.request();
    f.request(f.socket, { active: false });
    expect(f.room.localPracticePausedAt).toBe(1000);
    f.advance();
    expect(f.submit(job).code).toBe("local_practice_stale");
    expect(f.request().job.id).not.toBe(job.id);
    expect(f.room.localPracticePausedAt).toBeUndefined();
  });

  it("does not issue jobs during skills, human turns or ordinary capture resignation", () => {
    const f = fixture();
    f.room.game.pendingSkill = { id: "skill" };
    expect(f.request().job).toBeNull();
    f.room.game.pendingSkill = null;
    f.room.game.captures.white = 22;
    expect(f.request().job).toBeNull();
    f.room.practice.challenge = "capture-challenge";
    expect(f.request().job).toBeTruthy();
    f.room.game.turn = "white";
    expect(f.request().job).toBeNull();
  });

  it("completes a local challenge on the server at 100 moves", () => {
    const f = fixture({ challenge: "capture-challenge" });
    f.room.game.moveNumber = 99;
    f.room.game.captures.white = 28;
    const { job } = f.request();
    f.advance();
    expect(f.submit(job, { type: "pass", captures: 999 })).toEqual({ ok: true });
    expect(f.room.game.phase).toBe("finished");
    expect(f.room.game.winner.reason).toBe("capture-challenge");
    expect(f.room.game.captures.white).toBe(28);
  });

  it("persists the backend without persisting jobs and rejects legacy/special rooms", () => {
    const f = fixture();
    const { job } = f.request();
    const snapshot = roomPersistenceSnapshot(f.room);
    expect(JSON.stringify(snapshot)).not.toContain(job.id);
    const restored = hydratePersistedRoom(snapshot);
    expect(restored.practice.engineBackend).toBe("browser");
    restored.players.find((p) => p.user.id === "human").socketId = f.socket.id;
    f.rooms.set(f.room.code, restored);
    expect(f.submit(job).code).toBe("local_practice_stale");
    expect(f.request().job.id).not.toBe(job.id);
    restored.practice.engineBackend = "server";
    expect(f.request().code).toBe("local_practice_forbidden");
    const special = createSigrikaCandyDuelRoom({ user: { id: "human", username: "test" }, socketId: f.socket.id });
    expect(special.practice.engineBackend).toBe("server");
  });
});
