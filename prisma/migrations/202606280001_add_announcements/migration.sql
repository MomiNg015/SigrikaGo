CREATE TABLE IF NOT EXISTS "AnnouncementEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "kind" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL DEFAULT '',
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "firstPublishedAt" DATETIME,
  "deletedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AnnouncementRead" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "announcementId" TEXT NOT NULL,
  "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnnouncementRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "AnnouncementEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AnnouncementEntry_kind_isPublished_deletedAt_pinned_firstPublishedAt_idx" ON "AnnouncementEntry"("kind", "isPublished", "deletedAt", "pinned", "firstPublishedAt");
CREATE INDEX IF NOT EXISTS "AnnouncementEntry_kind_deletedAt_createdAt_idx" ON "AnnouncementEntry"("kind", "deletedAt", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "AnnouncementRead_userId_announcementId_key" ON "AnnouncementRead"("userId", "announcementId");
CREATE INDEX IF NOT EXISTS "AnnouncementRead_userId_readAt_idx" ON "AnnouncementRead"("userId", "readAt");
CREATE INDEX IF NOT EXISTS "AnnouncementRead_announcementId_idx" ON "AnnouncementRead"("announcementId");
