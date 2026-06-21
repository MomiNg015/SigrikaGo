CREATE TABLE IF NOT EXISTS "RecruitmentTask" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "itemType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "resultType" TEXT NOT NULL,
  "resultCharacterSlug" TEXT,
  "successRatePercent" INTEGER NOT NULL,
  "missStreakAtStart" INTEGER NOT NULL DEFAULT 0,
  "responseText" TEXT NOT NULL DEFAULT '',
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readyAt" DATETIME NOT NULL,
  "claimedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecruitmentTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "RecruitmentTask_userId_status_readyAt_idx" ON "RecruitmentTask"("userId", "status", "readyAt");
CREATE INDEX IF NOT EXISTS "RecruitmentTask_itemType_idx" ON "RecruitmentTask"("itemType");

CREATE TABLE IF NOT EXISTS "RecruitmentMissStreak" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "itemType" TEXT NOT NULL,
  "streak" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecruitmentMissStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "RecruitmentMissStreak_userId_itemType_key" ON "RecruitmentMissStreak"("userId", "itemType");
CREATE INDEX IF NOT EXISTS "RecruitmentMissStreak_itemType_idx" ON "RecruitmentMissStreak"("itemType");
