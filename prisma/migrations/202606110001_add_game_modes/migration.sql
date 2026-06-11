ALTER TABLE "GameRecord" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'spark';

CREATE TABLE "UserModeStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1000,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserModeStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "UserModeStats_userId_mode_key" ON "UserModeStats"("userId", "mode");
CREATE INDEX "UserModeStats_mode_rating_idx" ON "UserModeStats"("mode", "rating");

INSERT INTO "UserModeStats" ("id", "userId", "mode", "rating", "wins", "losses", "draws", "createdAt", "updatedAt")
SELECT
  'spark_' || "id",
  "id",
  'spark',
  COALESCE("rating", 1000),
  COALESCE("wins", 0),
  COALESCE("losses", 0),
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User";
