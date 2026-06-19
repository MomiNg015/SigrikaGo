CREATE TABLE IF NOT EXISTS "UserProfileLike" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "likerUserId" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "dayKey" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserProfileLike_likerUserId_fkey" FOREIGN KEY ("likerUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserProfileLike_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserProfileLike_likerUserId_targetUserId_dayKey_key" ON "UserProfileLike"("likerUserId", "targetUserId", "dayKey");
CREATE INDEX IF NOT EXISTS "UserProfileLike_targetUserId_idx" ON "UserProfileLike"("targetUserId");
CREATE INDEX IF NOT EXISTS "UserProfileLike_likerUserId_createdAt_idx" ON "UserProfileLike"("likerUserId", "createdAt");

CREATE TABLE IF NOT EXISTS "UserReport" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reporterUserId" TEXT NOT NULL,
  "reportedUserId" TEXT NOT NULL,
  "reporterUsername" TEXT NOT NULL,
  "reportedUsername" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserReport_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserReport_createdAt_idx" ON "UserReport"("createdAt");
CREATE INDEX IF NOT EXISTS "UserReport_reporterUserId_idx" ON "UserReport"("reporterUserId");
CREATE INDEX IF NOT EXISTS "UserReport_reportedUserId_idx" ON "UserReport"("reportedUserId");
