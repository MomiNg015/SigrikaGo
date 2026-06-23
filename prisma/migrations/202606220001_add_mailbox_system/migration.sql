CREATE TABLE IF NOT EXISTS "MailboxBatch" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "adminUserId" TEXT NOT NULL,
  "adminUsername" TEXT NOT NULL,
  "targetMode" TEXT NOT NULL,
  "recipientUserId" TEXT NOT NULL DEFAULT '',
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "attachmentType" TEXT NOT NULL DEFAULT 'none',
  "attachmentItemId" TEXT NOT NULL DEFAULT '',
  "attachmentQuantity" INTEGER NOT NULL DEFAULT 0,
  "includeFutureUsers" BOOLEAN NOT NULL DEFAULT false,
  "deliveredCount" INTEGER NOT NULL DEFAULT 0,
  "skippedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MailboxBatch_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "MailboxMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "batchId" TEXT,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "attachmentType" TEXT NOT NULL DEFAULT 'none',
  "attachmentItemId" TEXT NOT NULL DEFAULT '',
  "attachmentQuantity" INTEGER NOT NULL DEFAULT 0,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "readAt" DATETIME,
  "claimedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MailboxMessage_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MailboxBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MailboxMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "MailboxBatch_targetMode_createdAt_idx" ON "MailboxBatch"("targetMode", "createdAt");
CREATE INDEX IF NOT EXISTS "MailboxBatch_includeFutureUsers_createdAt_idx" ON "MailboxBatch"("includeFutureUsers", "createdAt");
CREATE INDEX IF NOT EXISTS "MailboxBatch_adminUserId_createdAt_idx" ON "MailboxBatch"("adminUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "MailboxMessage_userId_createdAt_idx" ON "MailboxMessage"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "MailboxMessage_userId_isRead_idx" ON "MailboxMessage"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "MailboxMessage_batchId_userId_idx" ON "MailboxMessage"("batchId", "userId");
