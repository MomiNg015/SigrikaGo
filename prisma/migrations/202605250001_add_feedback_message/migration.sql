CREATE TABLE IF NOT EXISTS "FeedbackMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "FeedbackMessage_createdAt_idx" ON "FeedbackMessage"("createdAt");
CREATE INDEX IF NOT EXISTS "FeedbackMessage_userId_idx" ON "FeedbackMessage"("userId");
