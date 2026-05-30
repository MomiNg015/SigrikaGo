CREATE TABLE "LoginSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "revokedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "LoginSession_refreshTokenHash_key" ON "LoginSession"("refreshTokenHash");
CREATE INDEX "LoginSession_userId_revokedAt_idx" ON "LoginSession"("userId", "revokedAt");
CREATE INDEX "LoginSession_expiresAt_idx" ON "LoginSession"("expiresAt");
