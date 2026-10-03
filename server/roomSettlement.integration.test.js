import { resetUserPassword } from "./adminUserManagement.js";
import { createLoginSessionStore } from "./loginSessions.js";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { createRoom } from "./roomFactory.js";
import { saveGameRecord } from "./roomResultPersistence.js";
import { roomPersistenceSnapshot, hydratePersistedRoom } from "./roomStatePersistence.js";

describe("durable room settlement", () => {
  let directory;
  let prisma;
  beforeAll(async () => {
    const root = path.resolve(".tmp");
    mkdirSync(root, { recursive: true });
    directory = mkdtempSync(path.join(root, "settlement-test-"));
    const url = `file:${path.join(directory, "test.db").replaceAll("\\", "/")}`;
    const bootstrap = new PrismaClient({ datasources: { db: { url } } });
    try { await bootstrap.$executeRawUnsafe("PRAGMA user_version = 0"); } finally { await bootstrap.$disconnect(); }
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
      env: { ...process.env, DATABASE_URL: url }, stdio: "pipe"
    });
    prisma = new PrismaClient({ datasources: { db: { url } } });
  }, 30000);
  afterAll(async () => {
    await prisma?.$disconnect();
    if (directory && directory.startsWith(path.resolve(".tmp") + path.sep)) rmSync(directory, { recursive: true, force: true });
  });
  async function finishedRoom(prefix) {
    const users = await Promise.all(["black", "white"].map((color) => prisma.user.create({ data: {
      id: `${prefix}-${color}`, username: `${prefix}-${color}`, passwordHash: "unused", coins: 0,
      rank: "3段", stars: 2, rating: 0, selectedCharacter: "sigrika", ownedCharacters: "sigrika"
    } })));
    const room = createRoom(...users.map((user) => ({ user: { ...user, ownedCharacters: ["sigrika"], modeStats: {} } })), { random: () => 0.75 });
    room.game.phase = "finished";
    room.game.moveNumber = 20;
    room.game.winner = { winnerColor: "black", reason: "resign", text: "黑胜" };
    return room;
  }
  test("two restored instances commit one replay, reward, stat and ledger set", async () => {
    const room = await finishedRoom("race");
    const stale = roomPersistenceSnapshot(room);
    const restored = hydratePersistedRoom(structuredClone(stale));
    await Promise.all([saveGameRecord({ prisma, room }), saveGameRecord({ prisma, room: restored })]);
    expect(await prisma.gameRecord.count({ where: { settlementId: room.settlementId } })).toBe(1);
    const winner = await prisma.user.findUnique({ where: { id: "race-black" } });
    expect(winner).toMatchObject({ coins: 50, wins: 1, stars: 3 });
    expect(await prisma.userModeStats.findUnique({ where: { userId_mode: { userId: winner.id, mode: "spark" } } })).toMatchObject({ wins: 1, stars: 3 });
    expect(room.recordSaved).toBe(true);
    expect(restored.game.resultRewards).toEqual(room.game.resultRewards);
    // Crash between the database commit and the persisted-room update.
    const afterCrash = hydratePersistedRoom(stale);
    await saveGameRecord({ prisma, room: afterCrash });
    expect(afterCrash.players[0].user).toMatchObject({ coins: 50, wins: 1, stars: 3 });
    expect((await prisma.user.findUnique({ where: { id: winner.id } })).coins).toBe(50);
  });
  test("a failed transaction exposes no rewards or saved snapshot, then retries once", async () => {
    const room = await finishedRoom("retry");
    let fail = true;
    const failing = new Proxy({}, { get(_target, key) {
      if (key === "$transaction") return (operations) => fail ? Promise.reject(new Error("database busy")) : prisma.$transaction(operations);
      const value = prisma[key];
      return typeof value === "function" ? value.bind(prisma) : value;
    } });
    await expect(saveGameRecord({ prisma: failing, room })).rejects.toThrow("database busy");
    expect(roomPersistenceSnapshot(room).recordSaved).toBe(false);
    expect(room.game.resultRewards).toBeUndefined();
    expect(room.players[0].user.coins).toBe(0);
    expect(await prisma.gameRecord.count({ where: { settlementId: room.settlementId } })).toBe(0);
    fail = false;
    await saveGameRecord({ prisma: failing, room });
    expect(room.players[0].user.coins).toBe(50);
    expect(room.recordSaved).toBe(true);
  });
  test("password reset atomically invalidates both access and refresh sessions", async () => {
    await prisma.user.create({ data: { id: "reset-user", username: "reset-user", passwordHash: "old" } });
    await prisma.user.create({ data: { id: "reset-admin", username: "reset-admin", passwordHash: "unused", role: "admin" } });
    const sessions = createLoginSessionStore({ prisma });
    const old = await sessions.create("reset-user");
    expect(await sessions.isActive("reset-user", old.sessionId)).toBe(true);
    await resetUserPassword({ prisma, adminUser: { id: "reset-admin" }, userId: "reset-user", password: "new-secret" });
    expect(await sessions.isActive("reset-user", old.sessionId)).toBe(false);
    expect(await sessions.refresh(old.refreshToken)).toBeNull();
    expect(await prisma.adminAuditLog.count({ where: { action: "user.reset-password" } })).toBe(1);
  });

});
