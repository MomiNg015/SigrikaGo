ALTER TABLE "User" ADD COLUMN "blueGems" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserCharacter" ADD COLUMN "chainCount" INTEGER NOT NULL DEFAULT 0;

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
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
);

CREATE TABLE IF NOT EXISTS "GachaDraw" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "poolId" TEXT NOT NULL,
  "drawCount" INTEGER NOT NULL,
  "coinCost" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GachaDraw_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GachaDraw_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "GachaPool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
);

CREATE INDEX IF NOT EXISTS "GachaPool_enabled_sortOrder_idx" ON "GachaPool"("enabled", "sortOrder");
CREATE INDEX IF NOT EXISTS "GachaPool_startsAt_endsAt_idx" ON "GachaPool"("startsAt", "endsAt");
CREATE INDEX IF NOT EXISTS "GachaPrize_poolId_enabled_sortOrder_idx" ON "GachaPrize"("poolId", "enabled", "sortOrder");
CREATE INDEX IF NOT EXISTS "GachaPrize_type_targetId_idx" ON "GachaPrize"("type", "targetId");
CREATE INDEX IF NOT EXISTS "GachaDraw_userId_createdAt_idx" ON "GachaDraw"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "GachaDraw_poolId_createdAt_idx" ON "GachaDraw"("poolId", "createdAt");
CREATE INDEX IF NOT EXISTS "GachaDrawReward_drawId_drawIndex_idx" ON "GachaDrawReward"("drawId", "drawIndex");
CREATE INDEX IF NOT EXISTS "GachaDrawReward_poolId_createdAt_idx" ON "GachaDrawReward"("poolId", "createdAt");
CREATE INDEX IF NOT EXISTS "GachaDrawReward_type_targetId_idx" ON "GachaDrawReward"("type", "targetId");
