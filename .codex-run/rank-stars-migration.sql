-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'player',
    "status" TEXT NOT NULL DEFAULT 'active',
    "banReason" TEXT,
    "bannedAt" DATETIME,
    "rank" TEXT NOT NULL DEFAULT '3段',
    "rating" INTEGER NOT NULL DEFAULT 0,
    "stars" INTEGER NOT NULL DEFAULT 2,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 300,
    "blueGems" INTEGER NOT NULL DEFAULT 0,
    "selectedCharacter" TEXT NOT NULL DEFAULT 'sigrika',
    "selectedStoneDecoration" TEXT NOT NULL DEFAULT '',
    "ownedCharacters" TEXT NOT NULL DEFAULT 'sigrika,denia',
    "ownedItems" TEXT NOT NULL DEFAULT '',
    "itemPurchaseCounts" TEXT NOT NULL DEFAULT '',
    "itemEffects" TEXT NOT NULL DEFAULT '',
    "ownedDecorations" TEXT NOT NULL DEFAULT '',
    "ownedMusicIds" TEXT NOT NULL DEFAULT '',
    "musicSelections" TEXT NOT NULL DEFAULT '{}',
    "onboardingRequired" BOOLEAN NOT NULL DEFAULT false,
    "onboardingAutoShownAt" DATETIME,
    "onboardingCompletedAt" DATETIME,
    "welcomeMailNoticeShownAt" DATETIME,
    "onboardingExitedAt" DATETIME,
    "homeOnboardingStatus" TEXT NOT NULL DEFAULT 'pending',
    "homeOnboardingFinishedAt" DATETIME,
    "sigrikaCandyUseCount" INTEGER NOT NULL DEFAULT 0,
    "sigrikaCandyPhase" TEXT NOT NULL DEFAULT 'normal',
    "sigrikaCandyOutcome" TEXT NOT NULL DEFAULT '',
    "sigrikaCandyRoomCode" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("banReason", "bannedAt", "blueGems", "coins", "createdAt", "homeOnboardingFinishedAt", "homeOnboardingStatus", "id", "itemEffects", "itemPurchaseCounts", "losses", "musicSelections", "onboardingAutoShownAt", "onboardingCompletedAt", "onboardingExitedAt", "onboardingRequired", "ownedCharacters", "ownedDecorations", "ownedItems", "ownedMusicIds", "passwordHash", "rank", "rating", "role", "selectedCharacter", "selectedStoneDecoration", "sigrikaCandyOutcome", "sigrikaCandyPhase", "sigrikaCandyRoomCode", "sigrikaCandyUseCount", "status", "updatedAt", "username", "welcomeMailNoticeShownAt", "wins") SELECT "banReason", "bannedAt", "blueGems", "coins", "createdAt", "homeOnboardingFinishedAt", "homeOnboardingStatus", "id", "itemEffects", "itemPurchaseCounts", "losses", "musicSelections", "onboardingAutoShownAt", "onboardingCompletedAt", "onboardingExitedAt", "onboardingRequired", "ownedCharacters", "ownedDecorations", "ownedItems", "ownedMusicIds", "passwordHash", "rank", "rating", "role", "selectedCharacter", "selectedStoneDecoration", "sigrikaCandyOutcome", "sigrikaCandyPhase", "sigrikaCandyRoomCode", "sigrikaCandyUseCount", "status", "updatedAt", "username", "welcomeMailNoticeShownAt", "wins" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE TABLE "new_UserModeStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 0,
    "stars" INTEGER NOT NULL DEFAULT 2,
    "rank" TEXT NOT NULL DEFAULT '3段',
    "recentResults" TEXT NOT NULL DEFAULT '',
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserModeStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserModeStats" ("createdAt", "draws", "id", "losses", "mode", "rank", "rating", "recentResults", "updatedAt", "userId", "wins") SELECT "createdAt", "draws", "id", "losses", "mode", "rank", "rating", "recentResults", "updatedAt", "userId", "wins" FROM "UserModeStats";
DROP TABLE "UserModeStats";
ALTER TABLE "new_UserModeStats" RENAME TO "UserModeStats";
CREATE INDEX "UserModeStats_mode_rating_idx" ON "UserModeStats"("mode", "rating");
CREATE UNIQUE INDEX "UserModeStats_userId_mode_key" ON "UserModeStats"("userId", "mode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

