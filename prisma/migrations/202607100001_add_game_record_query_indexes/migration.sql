CREATE INDEX IF NOT EXISTS "GameRecord_blackUserId_createdAt_idx" ON "GameRecord"("blackUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "GameRecord_whiteUserId_createdAt_idx" ON "GameRecord"("whiteUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "GameRecord_mode_rated_createdAt_idx" ON "GameRecord"("mode", "rated", "createdAt");
