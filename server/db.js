import { PrismaClient } from "@prisma/client";
import { DEFAULT_RANK, normalizeRank, parseRecentResults } from "../src/shared/rankProgression.js";
import { publicUserAssets } from "./userAssets.js";
import { ownedMusicIdsWithDefaults, parseMusicSelections } from "../src/shared/musicLibrary.js";

export const prisma = new PrismaClient();

export const USER_ASSET_RELATION_INCLUDE = {
  userCharacters: true,
  userDecorations: true,
  userItems: true,
  userItemEffects: true,
  modeStats: true
};

export const USER_ASSET_RELATION_SELECT = {
  userCharacters: { select: { characterSlug: true, chainCount: true } },
  userDecorations: { select: { decorationSlug: true } },
  userItems: { select: { itemId: true, quantity: true } },
  userItemEffects: { select: { effectKey: true, effectValue: true } },
  modeStats: { select: { mode: true, rating: true, rank: true, recentResults: true, wins: true, losses: true, draws: true } }
};

export async function ensureGameModeSchema(client = prisma) {
  if (!client?.$executeRawUnsafe || !client?.$queryRawUnsafe) return;
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserModeStats" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "mode" TEXT NOT NULL,
      "rating" INTEGER NOT NULL DEFAULT 1000,
      "rank" TEXT NOT NULL DEFAULT '3段',
      "recentResults" TEXT NOT NULL DEFAULT '',
      "wins" INTEGER NOT NULL DEFAULT 0,
      "losses" INTEGER NOT NULL DEFAULT 0,
      "draws" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "UserModeStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await client.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "UserModeStats_userId_mode_key" ON "UserModeStats"("userId", "mode")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UserModeStats_mode_rating_idx" ON "UserModeStats"("mode", "rating")`);

  const modeStatsColumns = await client.$queryRawUnsafe(`PRAGMA table_info("UserModeStats")`);
  const hasModeRank = modeStatsColumns.some((column) => column.name === "rank");
  if (!hasModeRank) {
    await client.$executeRawUnsafe(`ALTER TABLE "UserModeStats" ADD COLUMN "rank" TEXT NOT NULL DEFAULT '3段'`);
    await client.$executeRawUnsafe(`
      UPDATE "UserModeStats"
      SET "rank" = CASE
        WHEN "rating" >= 1700 THEN '9段'
        WHEN "rating" >= 1600 THEN '8段'
        WHEN "rating" >= 1500 THEN '7段'
        WHEN "rating" >= 1400 THEN '6段'
        WHEN "rating" >= 1300 THEN '5段'
        WHEN "rating" >= 1200 THEN '4段'
        WHEN "rating" >= 1100 THEN '3段'
        WHEN "rating" >= 1000 THEN '2段'
        WHEN "rating" >= 900 THEN '1段'
        WHEN "rating" >= 800 THEN '1级'
        WHEN "rating" >= 700 THEN '2级'
        WHEN "rating" >= 600 THEN '3级'
        WHEN "rating" >= 500 THEN '4级'
        WHEN "rating" >= 400 THEN '5级'
        WHEN "rating" >= 300 THEN '6级'
        WHEN "rating" >= 200 THEN '7级'
        WHEN "rating" >= 100 THEN '8级'
        WHEN "rating" >= 0 THEN '9级'
        ELSE '10级'
      END
    `);
  }
  const hasRecentResults = modeStatsColumns.some((column) => column.name === "recentResults");
  if (!hasRecentResults) {
    await client.$executeRawUnsafe(`ALTER TABLE "UserModeStats" ADD COLUMN "recentResults" TEXT NOT NULL DEFAULT ''`);
  }

  const gameRecordColumns = await client.$queryRawUnsafe(`PRAGMA table_info("GameRecord")`);
  const hasGameRecordMode = gameRecordColumns.some((column) => column.name === "mode");
  if (!hasGameRecordMode) {
    await client.$executeRawUnsafe(`ALTER TABLE "GameRecord" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'spark'`);
  }
  await client.$executeRawUnsafe(`UPDATE "GameRecord" SET "mode" = 'spark' WHERE "mode" IS NULL OR "mode" = ''`);
  await client.$executeRawUnsafe(`
    INSERT OR IGNORE INTO "UserModeStats" ("id", "userId", "mode", "rating", "wins", "losses", "draws", "createdAt", "updatedAt")
    SELECT "id" || ':spark', "id", 'spark', "rating", "wins", "losses", 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM "User"
  `);
}

export async function ensureGachaSchema(client = prisma) {
  if (!client?.$executeRawUnsafe || !client?.$queryRawUnsafe) return;
  const userColumns = await client.$queryRawUnsafe(`PRAGMA table_info("User")`);
  if (!userColumns.some((column) => column.name === "blueGems")) {
    await client.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "blueGems" INTEGER NOT NULL DEFAULT 0`);
  }
  const userCharacterColumns = await client.$queryRawUnsafe(`PRAGMA table_info("UserCharacter")`);
  if (!userCharacterColumns.some((column) => column.name === "chainCount")) {
    await client.$executeRawUnsafe(`ALTER TABLE "UserCharacter" ADD COLUMN "chainCount" INTEGER NOT NULL DEFAULT 0`);
  }
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GachaPool" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "description" TEXT NOT NULL DEFAULT '',
      "enabled" BOOLEAN NOT NULL DEFAULT true,
      "permanent" BOOLEAN NOT NULL DEFAULT false,
      "startsAt" DATETIME,
      "endsAt" DATETIME,
      "singleDrawPrice" INTEGER NOT NULL DEFAULT 50,
      "tenDrawPrice" INTEGER NOT NULL DEFAULT 500,
      "featuredPrizeId" TEXT,
      "featuredPrizeIds" TEXT,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const gachaPoolColumns = await client.$queryRawUnsafe(`PRAGMA table_info("GachaPool")`);
  if (!gachaPoolColumns.some((column) => column.name === "featuredPrizeIds")) {
    await client.$executeRawUnsafe(`ALTER TABLE "GachaPool" ADD COLUMN "featuredPrizeIds" TEXT`);
  }
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GachaPrize" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "poolId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "targetId" TEXT NOT NULL DEFAULT '',
      "quantity" INTEGER NOT NULL DEFAULT 1,
      "probabilityBasisPoints" INTEGER NOT NULL,
      "enabled" BOOLEAN NOT NULL DEFAULT true,
      "name" TEXT NOT NULL DEFAULT '',
      "imageUrl" TEXT NOT NULL DEFAULT '',
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "GachaPrize_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "GachaPool" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GachaDraw" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "poolId" TEXT NOT NULL,
      "drawCount" INTEGER NOT NULL,
      "coinCost" INTEGER NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "GachaDraw_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "GachaDraw_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "GachaPool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GachaDrawReward" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "drawId" TEXT NOT NULL,
      "poolId" TEXT NOT NULL,
      "prizeId" TEXT,
      "drawIndex" INTEGER NOT NULL,
      "type" TEXT NOT NULL,
      "targetId" TEXT NOT NULL DEFAULT '',
      "quantity" INTEGER NOT NULL,
      "unlockedQuantity" INTEGER NOT NULL DEFAULT 0,
      "duplicateQuantity" INTEGER NOT NULL DEFAULT 0,
      "blueGemsAdded" INTEGER NOT NULL DEFAULT 0,
      "chainAdded" INTEGER NOT NULL DEFAULT 0,
      "coinsAdded" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "GachaDrawReward_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "GachaDraw" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "GachaDrawReward_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "GachaPrize" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GachaPool_enabled_sortOrder_idx" ON "GachaPool"("enabled", "sortOrder")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GachaPool_startsAt_endsAt_idx" ON "GachaPool"("startsAt", "endsAt")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GachaPrize_poolId_enabled_sortOrder_idx" ON "GachaPrize"("poolId", "enabled", "sortOrder")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GachaPrize_type_targetId_idx" ON "GachaPrize"("type", "targetId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GachaDraw_userId_createdAt_idx" ON "GachaDraw"("userId", "createdAt")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GachaDraw_poolId_createdAt_idx" ON "GachaDraw"("poolId", "createdAt")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GachaDrawReward_drawId_drawIndex_idx" ON "GachaDrawReward"("drawId", "drawIndex")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GachaDrawReward_poolId_createdAt_idx" ON "GachaDrawReward"("poolId", "createdAt")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GachaDrawReward_type_targetId_idx" ON "GachaDrawReward"("type", "targetId")`);
}

export function publicUser(user) {
  const assets = publicUserAssets(user);
  return {
    id: user.id,
    username: user.username,
    role: user.role ?? "player",
    status: user.status ?? "active",
    rank: publicUserRank(user),
    rating: user.rating,
    wins: user.wins,
    losses: user.losses,
    modeStats: publicModeStats(user),
    coins: user.coins,
    blueGems: Number(user.blueGems ?? 0),
    ...assets,
    ownedMusicIds: ownedMusicIdsWithDefaults(user.ownedMusicIds),
    musicSelections: parseMusicSelections(user.musicSelections)
  };
}

function publicModeStats(user) {
  const rows = modeStatsRows(user.modeStats);
  const stats = {
    spark: {
      rating: Number(user.rating ?? 1000),
      rank: normalizeRank(user.rank ?? DEFAULT_RANK),
      recentResults: [],
      wins: Number(user.wins ?? 0),
      losses: Number(user.losses ?? 0),
      draws: 0
    },
    standard: {
      rating: 1000,
      rank: DEFAULT_RANK,
      recentResults: [],
      wins: 0,
      losses: 0,
      draws: 0
    }
  };
  for (const row of rows) {
    if (!stats[row.mode]) continue;
    stats[row.mode] = {
      rating: Number(row.rating ?? stats[row.mode].rating),
      rank: normalizeRank(row.rank ?? stats[row.mode].rank),
      recentResults: parseRecentResults(row.recentResults),
      wins: Number(row.wins ?? 0),
      losses: Number(row.losses ?? 0),
      draws: Number(row.draws ?? 0)
    };
  }
  return stats;
}

function publicUserRank(user) {
  const spark = modeStatsRows(user.modeStats).find((row) => row.mode === "spark");
  return normalizeRank(spark?.rank ?? user.rank ?? DEFAULT_RANK);
}

function modeStatsRows(modeStats) {
  if (Array.isArray(modeStats)) return modeStats;
  if (!modeStats || typeof modeStats !== "object") return [];
  return Object.entries(modeStats).map(([mode, stats]) => ({ mode, ...(stats ?? {}) }));
}
