export async function ensureCaptureChallengeSchema(client) {
  if (!client?.$executeRawUnsafe) return;
  await client.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "CaptureChallengeBest" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "captures" INTEGER NOT NULL,
    "characterId" TEXT NOT NULL,
    "costumeSnapshot" TEXT NOT NULL DEFAULT 'null',
    "bestRank" INTEGER NOT NULL,
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
}
