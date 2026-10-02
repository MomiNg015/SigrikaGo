import { afterAll, beforeAll, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { migrateRankStars, RANK_STARS_MIGRATION_KEY } from "./rankStarsMigration.js";

let prisma;
let directory;
beforeAll(async () => {
  await mkdir(resolve(".tmp"), { recursive: true });
  directory = await mkdtemp(resolve(".tmp/rank-stars-"));
  prisma = new PrismaClient({ datasourceUrl: `file:${join(directory, "test.db").replaceAll("\\", "/")}` });
  const migrations = new URL("../prisma/migrations/", import.meta.url);
  for (const entry of (await readdir(migrations, { withFileTypes: true })).filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const sql = await readFile(new URL(entry.name + "/migration.sql", migrations), "utf8");
    for (const statement of sql.split(";").map((value) => value.trim()).filter(Boolean)) await prisma.$executeRawUnsafe(statement);
  }
});
afterAll(async () => {
  await prisma?.$disconnect();
  if (directory) await rm(directory, { recursive: true, force: true });
});

it("rolls back the receipt and data when a legacy condition cannot be migrated", async () => {
  const user = await prisma.user.create({ data: { username: "rollback", passwordHash: "fixture", rank: "8段", rating: 1800 } });
  const bad = await prisma.achievement.create({ data: {
    key: "malformed", name: "fixture", content: "fixture", conditionType: "rating", conditionParams: "invalid json"
  } });
  await expect(migrateRankStars(prisma)).rejects.toThrow();
  expect(await prisma.siteSetting.findUnique({ where: { key: RANK_STARS_MIGRATION_KEY } })).toBeNull();
  expect(await prisma.user.findUnique({ where: { id: user.id } })).toMatchObject({ rank: "8段", rating: 1800 });
  await prisma.achievement.delete({ where: { id: bad.id } });
  await prisma.user.delete({ where: { id: user.id } });
});

it("atomically backs up and resets every mode, preserves assets, migrates conditions and live snapshots only once", async () => {
  const user = await prisma.user.create({ data: {
    username: "migration-player", passwordHash: "fixture", rank: "9段", rating: 1900, coins: 789,
    modeStats: { create: [{ mode: "spark", rank: "9段", rating: 1900, wins: 30 }, { mode: "standard", rank: "1级", rating: 20 }] }
  } });
  const achievement = await prisma.achievement.create({ data: {
    key: "old-rating", name: "旧成就", content: "fixture", conditionType: "rating", conditionParams: '{"value":1400}'
  } });
  await prisma.userAchievement.create({ data: { userId: user.id, achievementId: achievement.id } });
  await prisma.persistedRoom.create({ data: {
    code: "12345", snapshot: JSON.stringify({ players: [{ user: { ...user, modeStats: { spark: { rating: 1900, rank: "9段" } } } }] })
  } });
  for (const recordSaved of [false, true]) {
    await prisma.persistedRoom.create({ data: {
      code: recordSaved ? "saved" : "unsaved", status: "finished",
      snapshot: JSON.stringify({ recordSaved, players: [{ user }] })
    } });
  }
  await migrateRankStars(prisma);
  const reset = await prisma.user.findUnique({ where: { id: user.id }, include: { modeStats: true, userCharacters: true, achievements: true } });
  expect(reset).toMatchObject({ rank: "3段", stars: 2, rating: 0, coins: 789 });
  expect(reset.modeStats).toHaveLength(3);
  expect(reset.modeStats.every((row) => row.rank === "3段" && row.stars === 2 && row.rating === 0)).toBe(true);
  expect(reset.modeStats.find((row) => row.mode === "spark").wins).toBe(30);
  expect(reset.userCharacters.map((row) => row.characterSlug)).toContain("nabomo");
  expect(reset.achievements).toHaveLength(1);
  const migratedAchievement = await prisma.achievement.findUnique({ where: { id: achievement.id } });
  expect(migratedAchievement.conditionType).toBe("rank");
  expect(JSON.parse(migratedAchievement.conditionParams).value).toBe(6);
  const backup = await prisma.siteSetting.findUnique({ where: { key: RANK_STARS_MIGRATION_KEY } });
  expect(JSON.parse(backup.value).users[0].rating).toBe(1900);
  const room = await prisma.persistedRoom.findUnique({ where: { code: "12345" } });
  expect(JSON.parse(room.snapshot).players[0].user).toMatchObject({ rank: "3段", stars: 2, rating: 0 });
  const unsaved = await prisma.persistedRoom.findUnique({ where: { code: "unsaved" } });
  const saved = await prisma.persistedRoom.findUnique({ where: { code: "saved" } });
  expect(JSON.parse(unsaved.snapshot).players[0].user.rank).toBe("3段");
  expect(JSON.parse(saved.snapshot).players[0].user.rank).toBe("9段");
  await prisma.user.update({ where: { id: user.id }, data: { stars: 4 } });
  await migrateRankStars(prisma);
  expect((await prisma.user.findUnique({ where: { id: user.id } })).stars).toBe(4);
  expect((await prisma.siteSetting.findUnique({ where: { key: RANK_STARS_MIGRATION_KEY } })).value).toBe(backup.value);
  const newcomer = await prisma.user.create({ data: { username: "newcomer", passwordHash: "fixture" } });
  expect(newcomer).toMatchObject({ rank: "3段", stars: 2, rating: 0 });
});
