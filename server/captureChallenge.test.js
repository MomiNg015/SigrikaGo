import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createPracticeRoom } from "./roomFactory.js";
import { GAME_PHASES, createGameState } from "../src/shared/game.js";
import { CAPTURE_CHALLENGE_MODE } from "../src/shared/captureChallenge.js";
import { ensureCaptureChallengeSchema } from "./captureChallengeSchema.js";
import { finishCaptureChallenge, listCaptureChallengeLeaderboard } from "./captureChallenge.js";
import { saveGameRecord } from "./roomResultPersistence.js";
import { applyStandardGameAction } from "./roomGameActions.js";
import { applyCountingRequest, applyDrawRequest, applyDrawResponse } from "./roomScoringFlow.js";
import { handleRoomTestAction } from "./roomTestActions.js";
import { createRoomSkillLifecycle } from "./roomSkillResolution.js";
import { roomPersistenceSnapshot, hydratePersistedRoom } from "./roomStatePersistence.js";
import { createRoomRequestLifecycle } from "./roomRequestLifecycle.js";
import { buildRoomView } from "./roomView.js";

function challenge(userId = "a", captures = 10, characterId = "sigrika") {
  const room = createPracticeRoom({ user: { id: userId, username: userId, selectedCharacter: characterId }, socketId: "socket" }, {
    challenge: CAPTURE_CHALLENGE_MODE, difficulty: "beginner", playerColor: "black"
  });
  room.game.phase = GAME_PHASES.playing;
  room.game.moveNumber = 100;
  room.game.captures.black = captures;
  room.game.skillRemovals.black = 999;
  return room;
}

describe("capture challenge authoritative play", () => {
  it("resolves the 100th skill before finishing and preserves challenge identity on restore", () => {
    const room = challenge();
    const game = structuredClone(room.game);
    room.game.moveNumber = 99;
    room.game.phase = GAME_PHASES.skillPreview;
    room.game.pendingSkill = { id: "skill-100" };
    room.pendingSkillResolution = { pendingSkillId: "skill-100", game, playerColor: "black" };
    const restored = hydratePersistedRoom(roomPersistenceSnapshot(room));
    expect(restored.practice.challengeId).toBe(room.practice.challengeId);
    const scheduleRoomClose = vi.fn();
    const lifecycle = createRoomSkillLifecycle({ rooms: new Map([[restored.code, restored]]),
      appendSystem: vi.fn(), appendNotices: vi.fn(), scheduleRoomTimeout: vi.fn(), resetByoYomi: vi.fn(),
      scheduleRoomClose, broadcastRoom: vi.fn() });
    expect(lifecycle.completePendingSkillResolution(restored.code, "skill-100", {})).toBe(true);
    expect(restored.game.moveNumber).toBe(100);
    expect(restored.game.captures.black).toBe(10);
    expect(restored.game.phase).toBe(GAME_PHASES.finished);
    expect(scheduleRoomClose).toHaveBeenCalledOnce();
    const view = buildRoomView(restored, "a");
    expect(view.practice.challenge).toBe(CAPTURE_CHALLENGE_MODE);
    expect(view.practice.challengeId).toBeUndefined();
  });
  it("forces advanced difficulty and blocks counting, draw requests/responses and debug actions", () => {
    const room = challenge();
    expect(room.practice.difficulty).toBe("advanced");
    expect(room.practice.challengeId).toBeTruthy();
    expect(applyCountingRequest({ room })).toMatchObject({ ok: false });
    expect(applyDrawRequest({ room })).toMatchObject({ ok: false });
    expect(applyDrawResponse({ room })).toMatchObject({ ok: false });
    const lifecycle = createRoomRequestLifecycle({ rooms: new Map([[room.code, room]]),
      validateRoomCode: (value) => ({ ok: true, value }) });
    expect(lifecycle.requestDraw(room.code, "a")).toMatchObject({ ok: false });
    room.game.phase = GAME_PHASES.drawRequested;
    expect(lifecycle.respondDraw(room.code, "a", true)).toMatchObject({ ok: false });
    expect(room.game.phase).toBe(GAME_PHASES.drawRequested);
    expect(handleRoomTestAction({ room, action: { type: "test-random-layout" } })).toMatchObject({ ok: false });
  });

  it.each(["pass", "move"])("finishes on the 100th %s, before another passive turn", (type) => {
    const room = challenge();
    room.game.moveNumber = 99;
    const scheduleRoomClose = vi.fn();
    const maybeStartPassiveSkill = vi.fn();
    const result = applyStandardGameAction({
      room, player: room.players[0], action: { type, pointId: "0,0" }, io: {},
      appendSystem: vi.fn(), appendNotices: vi.fn(), broadcastToast: vi.fn(), resetByoYomi: vi.fn(),
      scheduleRoomClose, maybeStartPassiveSkill
    });
    expect(result.ok).toBe(true);
    expect(room.game.phase).toBe(GAME_PHASES.finished);
    expect(room.game.winner.reason).toBe("capture-challenge");
    expect(scheduleRoomClose).toHaveBeenCalledOnce();
    expect(maybeStartPassiveSkill).not.toHaveBeenCalled();
  });

  it("does not finish early or while a skill is pending, and leaves ordinary practice alone", () => {
    const room = challenge();
    room.game.moveNumber = 99;
    expect(finishCaptureChallenge(room)).toBe(false);
    room.game.moveNumber = 100;
    room.game.pendingSkill = { id: "skill" };
    expect(finishCaptureChallenge(room)).toBe(false);
    room.game.pendingSkill = null;
    room.practice.challenge = null;
    expect(finishCaptureChallenge(room)).toBe(false);
    expect(room.game.phase).toBe(GAME_PHASES.playing);
  });

  it("includes captures made by the 100th move", () => {
    const room = challenge();
    room.game = createGameState([{ color: "black" }, { color: "white" }]);
    room.game.moveNumber = 99;
    for (const [id, stone] of [["0,0", "white"], ["1,0", "black"]]) {
      room.game.points.find((point) => point.id === id).stone = stone;
    }
    applyStandardGameAction({ room, player: room.players[0], action: { type: "move", pointId: "0,1" },
      appendSystem: vi.fn(), appendNotices: vi.fn(), broadcastToast: vi.fn(), resetByoYomi: vi.fn(),
      scheduleRoomClose: vi.fn(), maybeStartPassiveSkill: vi.fn() });
    expect(room.game.captures.black).toBe(1);
    expect(room.game.phase).toBe(GAME_PHASES.finished);
  });
});

describe("capture challenge SQLite persistence", () => {
  let directory;
  let prisma;
  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), "sigrika-capture-test-"));
    prisma = new PrismaClient({ datasources: { db: { url: `file:${join(directory, "test.db").replaceAll("\\", "/")}` } } });
    await prisma.$executeRawUnsafe('CREATE TABLE "User" ("id" TEXT PRIMARY KEY, "username" TEXT, "rank" TEXT)');
    await prisma.$executeRawUnsafe(`CREATE TABLE "UserModeStats" (
      "id" TEXT PRIMARY KEY, "userId" TEXT, "mode" TEXT, "rating" INTEGER, "rank" TEXT,
      "recentResults" TEXT, "wins" INTEGER, "losses" INTEGER, "draws" INTEGER, "createdAt" DATETIME, "updatedAt" DATETIME
    )`);
    await ensureCaptureChallengeSchema(prisma);
    await ensureCaptureChallengeSchema(prisma);
    for (const id of ["a", "b", "c", "d"]) {
      await prisma.$executeRaw`INSERT INTO "User" ("id", "username", "rank") VALUES (${id}, ${id}, '3段')`;
    }
  });
  beforeEach(async () => {
    await prisma.captureChallengeResult.deleteMany();
    await prisma.captureChallengeBest.deleteMany();
  });
  afterAll(async () => {
    await prisma?.$disconnect();
    if (directory) await rm(directory, { recursive: true, force: true });
  });
  async function complete(userId, captures, characterId) {
    const room = challenge(userId, captures, characterId);
    finishCaptureChallenge(room);
    await saveGameRecord({ prisma, room });
    return room;
  }

  it("records zero, ignores skill removals, preserves ties' character, and updates only higher records", async () => {
    const first = await complete("a", 0);
    expect(first.practice.result).toEqual({ captures: 0, rank: 1, breakthrough: true });
    await complete("a", 20, "denia");
    await complete("a", 20, "sigrika");
    await complete("a", 5, "sigrika");
    expect(await prisma.captureChallengeBest.findUnique({ where: { userId: "a" } })).toMatchObject({ captures: 20, characterId: "denia", bestRank: 1 });
    await complete("a", 21, "sigrika");
    expect((await listCaptureChallengeLeaderboard(prisma))[0]).toMatchObject({ captures: 21, recordCharacter: "sigrika", ranking: 1 });
  });

  it("ranks this attempt against other bests and persists historical breakthroughs and competition ties", async () => {
    await complete("b", 30);
    await complete("c", 20);
    await complete("d", 10);
    expect((await complete("a", 5)).practice.result).toMatchObject({ rank: 4, breakthrough: true });
    expect((await complete("a", 20)).practice.result).toMatchObject({ rank: 2, breakthrough: true });
    expect((await listCaptureChallengeLeaderboard(prisma)).map((row) => row.ranking)).toEqual([1, 2, 2, 4]);
    expect((await complete("a", 5)).practice.result).toMatchObject({ rank: 4, breakthrough: false });
    expect((await complete("a", 20)).practice.result).toMatchObject({ rank: 2, breakthrough: false });
    const record = await complete("a", 31);
    expect(record.practice.result).toMatchObject({ rank: 1, breakthrough: true });
    const restored = structuredClone(record);
    restored.recordSaved = false;
    delete restored.practice.result;
    await saveGameRecord({ prisma, room: restored });
    expect(restored.practice.result).toEqual(record.practice.result);
    expect(await prisma.captureChallengeResult.count({ where: { id: record.practice.challengeId } })).toBe(1);
  });

  it("does not persist an early finish and keeps failed writes retryable", async () => {
    const early = challenge();
    early.game.phase = GAME_PHASES.finished;
    early.game.moveNumber = 99;
    early.game.winner = { reason: "resign" };
    await saveGameRecord({ prisma, room: early });
    expect(await prisma.captureChallengeBest.count()).toBe(0);
    const room = challenge();
    finishCaptureChallenge(room);
    await expect(saveGameRecord({ prisma: { $transaction: vi.fn().mockRejectedValue(new Error("offline")) }, room })).rejects.toThrow("offline");
    expect(room.recordSaved).toBe(false);
    await saveGameRecord({ prisma, room });
    expect(room.recordSaved).toBe(true);
  });
});
