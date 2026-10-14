ALTER TABLE "UserModeStats" ADD COLUMN "leaderboardReachedAt" DATETIME;
UPDATE "UserModeStats" SET "leaderboardReachedAt" = "updatedAt" WHERE "leaderboardReachedAt" IS NULL;

ALTER TABLE "CaptureChallengeBest" ADD COLUMN "reachedAt" DATETIME NOT NULL DEFAULT 0;
UPDATE "CaptureChallengeBest" SET "reachedAt" = COALESCE((
  SELECT MIN(CASE WHEN typeof("createdAt") = 'text' THEN CAST(ROUND((julianday("createdAt") - 2440587.5) * 86400000) AS INTEGER) ELSE "createdAt" END)
  FROM "CaptureChallengeResult" AS result
  WHERE result."userId" = "CaptureChallengeBest"."userId" AND result."captures" = "CaptureChallengeBest"."captures"
), 0);
CREATE INDEX "CaptureChallengeBest_captures_reachedAt_userId_idx" ON "CaptureChallengeBest"("captures", "reachedAt", "userId");
