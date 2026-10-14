export async function ensureCaptureChallengeSchema(client) {
  if (!client?.$executeRawUnsafe) return;
  await client.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "CaptureChallengeBest" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "captures" INTEGER NOT NULL,
    "characterId" TEXT NOT NULL,
    "costumeSnapshot" TEXT NOT NULL DEFAULT 'null',
    "bestRank" INTEGER NOT NULL,
    "reachedAt" DATETIME NOT NULL DEFAULT 0,
    CONSTRAINT "CaptureChallengeBest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CaptureChallengeBest_captures_idx" ON "CaptureChallengeBest"("captures")`);
  await client.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "CaptureChallengeResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "captures" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "breakthrough" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CaptureChallengeResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CaptureChallengeResult_userId_idx" ON "CaptureChallengeResult"("userId")`);
  const columns = await client.$queryRawUnsafe(`PRAGMA table_info("CaptureChallengeBest")`);
  if (!columns.some(column => column.name === "reachedAt")) {
    await client.$executeRawUnsafe(`ALTER TABLE "CaptureChallengeBest" ADD COLUMN "reachedAt" DATETIME NOT NULL DEFAULT 0`);
  }
  await client.$executeRawUnsafe(`UPDATE "CaptureChallengeBest" SET "reachedAt" = COALESCE((
    SELECT MIN(CASE WHEN typeof("createdAt") = 'text' THEN CAST(ROUND((julianday("createdAt") - 2440587.5) * 86400000) AS INTEGER) ELSE "createdAt" END)
    FROM "CaptureChallengeResult" AS result
    WHERE result."userId" = "CaptureChallengeBest"."userId" AND result."captures" = "CaptureChallengeBest"."captures"
  ), 0) WHERE "reachedAt" = 0`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CaptureChallengeBest_captures_reachedAt_userId_idx" ON "CaptureChallengeBest"("captures", "reachedAt", "userId")`);
}
