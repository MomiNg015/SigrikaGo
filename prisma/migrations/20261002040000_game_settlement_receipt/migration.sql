ALTER TABLE "GameRecord" ADD COLUMN "settlementId" TEXT;
ALTER TABLE "GameRecord" ADD COLUMN "settlementState" TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX "GameRecord_settlementId_key" ON "GameRecord"("settlementId");
