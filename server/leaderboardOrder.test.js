import { expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureGameModeSchema } from "./db.js";
import { ensureCaptureChallengeSchema } from "./captureChallengeSchema.js";
import { profileCaptureRecord } from "./profileCaptureRecord.js";
import { listCaptureChallengeLeaderboard } from "./captureChallenge.js";

it.each(["startup", "migration"])("backfills arrival from legacy timestamps using %s and preserves it on repeated startup", async path => {
  const directory = await mkdtemp(join(tmpdir(), "leaderboard-order-"));
  const prisma = new PrismaClient({ datasourceUrl: `file:${join(directory, "test.db").replaceAll("\\", "/")}` });
  const migrations = new URL("../prisma/migrations/", import.meta.url);
  const apply = async name => {
    const sql = await readFile(new URL(`${name}/migration.sql`, migrations), "utf8");
    for (const statement of sql.split(";").map(s => s.trim()).filter(Boolean)) await prisma.$executeRawUnsafe(statement);
  };
  try {
    for (const entry of (await readdir(migrations, { withFileTypes: true })).filter(entry => entry.isDirectory() && entry.name !== "20261014090000_unique_leaderboard_order").sort((a, b) => a.name.localeCompare(b.name))) await apply(entry.name);
    for (const id of ["a", "z"]) {
      await prisma.$executeRaw`INSERT INTO "User" ("id", "username", "passwordHash", "updatedAt") VALUES (${id}, ${id}, 'fixture', '2026-01-03 00:00:00')`;
      await prisma.$executeRaw`INSERT INTO "UserModeStats" ("id", "userId", "mode", "updatedAt", "wins") VALUES (${id}, ${id}, 'spark', '2026-01-03 00:00:00', 7)`;
      await prisma.$executeRaw`INSERT INTO "CaptureChallengeBest" ("userId", "captures", "characterId", "bestRank") VALUES (${id}, 20, 'sigrika', 1)`;
    }
    await prisma.$executeRawUnsafe(`INSERT INTO "CaptureChallengeResult" ("id", "userId", "captures", "rank", "breakthrough", "createdAt") VALUES ('early', 'z', 20, 1, 1, '2026-01-01 00:00:00'), ('late', 'a', 20, 1, 1, '2026-01-02 00:00:00'), ('repeat', 'z', 20, 1, 0, '2026-01-04 00:00:00')`);
    if (path === "migration") await apply("20261014090000_unique_leaderboard_order");
    await ensureGameModeSchema(prisma);
    await ensureCaptureChallengeSchema(prisma);
    const before = await prisma.captureChallengeBest.findMany({ orderBy: { userId: "asc" } });
    await ensureGameModeSchema(prisma);
    await ensureCaptureChallengeSchema(prisma);
    expect(await prisma.captureChallengeBest.findMany({ orderBy: { userId: "asc" } })).toEqual(before);
    expect((await listCaptureChallengeLeaderboard(prisma)).map(row => [row.id, row.ranking])).toEqual([["z", 1], ["a", 2]]);
    expect(await profileCaptureRecord({ prisma, userId: "a" })).toMatchObject({ captures: 20, ranking: 2 });
    const stats = await prisma.userModeStats.findUnique({ where: { userId_mode: { userId: "a", mode: "spark" } } });
    expect(stats.wins).toBe(7);
    expect(stats.leaderboardReachedAt.toISOString()).toBe("2026-01-03T00:00:00.000Z");
    expect(before.find(row => row.userId === "z").reachedAt.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  } finally {
    await prisma.$disconnect();
    await rm(directory, { recursive: true, force: true });
  }
});
