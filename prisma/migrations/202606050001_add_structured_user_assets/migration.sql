CREATE TABLE IF NOT EXISTS "UserCharacter" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "characterSlug" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'legacy',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserCharacter_userId_characterSlug_key" ON "UserCharacter"("userId", "characterSlug");
CREATE INDEX IF NOT EXISTS "UserCharacter_characterSlug_idx" ON "UserCharacter"("characterSlug");

CREATE TABLE IF NOT EXISTS "UserDecoration" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "decorationSlug" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'legacy',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserDecoration_userId_decorationSlug_key" ON "UserDecoration"("userId", "decorationSlug");
CREATE INDEX IF NOT EXISTS "UserDecoration_decorationSlug_idx" ON "UserDecoration"("decorationSlug");

CREATE TABLE IF NOT EXISTS "UserItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "source" TEXT NOT NULL DEFAULT 'legacy',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserItem_userId_itemId_key" ON "UserItem"("userId", "itemId");
CREATE INDEX IF NOT EXISTS "UserItem_itemId_idx" ON "UserItem"("itemId");

CREATE TABLE IF NOT EXISTS "UserItemEffect" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "effectKey" TEXT NOT NULL,
  "effectValue" TEXT NOT NULL DEFAULT 'true',
  "source" TEXT NOT NULL DEFAULT 'legacy',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserItemEffect_userId_effectKey_key" ON "UserItemEffect"("userId", "effectKey");
CREATE INDEX IF NOT EXISTS "UserItemEffect_effectKey_idx" ON "UserItemEffect"("effectKey");

CREATE TABLE IF NOT EXISTS "UserProgressLedger" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "metric" TEXT NOT NULL,
  "delta" INTEGER NOT NULL,
  "beforeValue" INTEGER,
  "afterValue" INTEGER,
  "reason" TEXT NOT NULL DEFAULT '',
  "refType" TEXT NOT NULL DEFAULT '',
  "refId" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "UserProgressLedger_userId_metric_createdAt_idx" ON "UserProgressLedger"("userId", "metric", "createdAt");
CREATE INDEX IF NOT EXISTS "UserProgressLedger_refType_refId_idx" ON "UserProgressLedger"("refType", "refId");
