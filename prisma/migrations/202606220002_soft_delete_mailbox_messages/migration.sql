ALTER TABLE "MailboxMessage" ADD COLUMN "deletedAt" DATETIME;

CREATE INDEX IF NOT EXISTS "MailboxMessage_userId_deletedAt_createdAt_idx" ON "MailboxMessage"("userId", "deletedAt", "createdAt");
