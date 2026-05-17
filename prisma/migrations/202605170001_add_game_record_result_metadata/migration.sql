ALTER TABLE "GameRecord" ADD COLUMN "winnerColor" TEXT;
ALTER TABLE "GameRecord" ADD COLUMN "resultReason" TEXT;
ALTER TABLE "GameRecord" ADD COLUMN "snapshotVersion" INTEGER NOT NULL DEFAULT 1;
