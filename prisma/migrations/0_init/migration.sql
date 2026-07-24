-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'player',
    "status" TEXT NOT NULL DEFAULT 'active',
    "banReason" TEXT,
    "bannedAt" DATETIME,
    "rank" TEXT NOT NULL DEFAULT '3段',
    "rating" INTEGER NOT NULL DEFAULT 1000,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RecruitmentTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resultType" TEXT NOT NULL,
    "resultCharacterSlug" TEXT,
    "successRatePercent" INTEGER NOT NULL,
    "missStreakAtStart" INTEGER NOT NULL DEFAULT 0,
    "responseText" TEXT NOT NULL DEFAULT '',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readyAt" DATETIME NOT NULL,
    "claimedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecruitmentTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecruitmentMissStreak" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecruitmentMissStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserModeStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1000,
    "rank" TEXT NOT NULL DEFAULT '3段',
    "recentResults" TEXT NOT NULL DEFAULT '',
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserModeStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "UserCharacter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "characterSlug" TEXT NOT NULL,
    "chainCount" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'legacy',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserCharacter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GachaPool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "permanent" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "singleDrawPrice" INTEGER NOT NULL DEFAULT 50,
    "tenDrawPrice" INTEGER NOT NULL DEFAULT 500,
    "featuredPrizeId" TEXT,
    "featuredPrizeIds" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GachaPrize" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetId" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "probabilityBasisPoints" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GachaPrize_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "GachaPool" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GachaDraw" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "drawCount" INTEGER NOT NULL,
    "coinCost" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GachaDraw_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GachaDraw_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "GachaPool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GachaDrawReward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drawId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "prizeId" TEXT,
    "drawIndex" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "targetId" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL,
    "unlockedQuantity" INTEGER NOT NULL DEFAULT 0,
    "duplicateQuantity" INTEGER NOT NULL DEFAULT 0,
    "blueGemsAdded" INTEGER NOT NULL DEFAULT 0,
    "chainAdded" INTEGER NOT NULL DEFAULT 0,
    "coinsAdded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GachaDrawReward_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "GachaDraw" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GachaDrawReward_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "GachaPrize" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserDecoration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "decorationSlug" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'legacy',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserDecoration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'legacy',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserItemEffect" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "effectKey" TEXT NOT NULL,
    "effectValue" TEXT NOT NULL DEFAULT 'true',
    "source" TEXT NOT NULL DEFAULT 'legacy',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserItemEffect_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserProgressLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "beforeValue" INTEGER,
    "afterValue" INTEGER,
    "reason" TEXT NOT NULL DEFAULT '',
    "refType" TEXT NOT NULL DEFAULT '',
    "refId" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MailboxBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminUserId" TEXT NOT NULL,
    "adminUsername" TEXT NOT NULL,
    "targetMode" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL DEFAULT '',
    "sender" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachmentType" TEXT NOT NULL DEFAULT 'none',
    "attachmentItemId" TEXT NOT NULL DEFAULT '',
    "attachmentQuantity" INTEGER NOT NULL DEFAULT 0,
    "includeFutureUsers" BOOLEAN NOT NULL DEFAULT false,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MailboxBatch_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MailboxMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT,
    "userId" TEXT NOT NULL,
    "sender" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachmentType" TEXT NOT NULL DEFAULT 'none',
    "attachmentItemId" TEXT NOT NULL DEFAULT '',
    "attachmentQuantity" INTEGER NOT NULL DEFAULT 0,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "claimedAt" DATETIME,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MailboxMessage_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MailboxBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MailboxMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserRelationship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserProfileLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "likerUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserProfileLike_likerUserId_fkey" FOREIGN KEY ("likerUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserProfileLike_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterUserId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reporterUsername" TEXT NOT NULL,
    "reportedUsername" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserReport_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomCode" TEXT NOT NULL,
    "blackUserId" TEXT NOT NULL,
    "whiteUserId" TEXT NOT NULL,
    "blackName" TEXT NOT NULL,
    "whiteName" TEXT NOT NULL,
    "blackCharacter" TEXT NOT NULL,
    "whiteCharacter" TEXT NOT NULL,
    "resultText" TEXT NOT NULL,
    "winnerColor" TEXT,
    "resultReason" TEXT,
    "rated" BOOLEAN NOT NULL DEFAULT true,
    "matchSource" TEXT NOT NULL DEFAULT 'matchmaking',
    "blackRatingDelta" INTEGER NOT NULL DEFAULT 0,
    "whiteRatingDelta" INTEGER NOT NULL DEFAULT 0,
    "blackCoinsDelta" INTEGER NOT NULL DEFAULT 0,
    "whiteCoinsDelta" INTEGER NOT NULL DEFAULT 0,
    "blackRankDelta" INTEGER NOT NULL DEFAULT 0,
    "whiteRankDelta" INTEGER NOT NULL DEFAULT 0,
    "moveCount" INTEGER NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'spark',
    "snapshot" TEXT NOT NULL,
    "snapshotVersion" INTEGER NOT NULL DEFAULT 1,
    "blackCostumeId" TEXT NOT NULL DEFAULT '',
    "whiteCostumeId" TEXT NOT NULL DEFAULT '',
    "blackCostumePortraitUrl" TEXT NOT NULL DEFAULT '',
    "whiteCostumePortraitUrl" TEXT NOT NULL DEFAULT '',
    "blackCostumePortraitScalePercent" INTEGER NOT NULL DEFAULT 100,
    "whiteCostumePortraitScalePercent" INTEGER NOT NULL DEFAULT 100,
    "blackCostumePortraitOffsetXPercent" INTEGER NOT NULL DEFAULT 0,
    "whiteCostumePortraitOffsetXPercent" INTEGER NOT NULL DEFAULT 0,
    "blackCostumePortraitOffsetYPercent" INTEGER NOT NULL DEFAULT 0,
    "whiteCostumePortraitOffsetYPercent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "portraitUrl" TEXT NOT NULL,
    "portraitSource" TEXT NOT NULL DEFAULT 'url',
    "acquisitionMethod" TEXT NOT NULL DEFAULT '',
    "cvName" TEXT NOT NULL DEFAULT '',
    "cvUrl" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'default',
    "palette" TEXT NOT NULL DEFAULT '#5d7fe8',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Costume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "characterSlug" TEXT NOT NULL,
    "portraitUrl" TEXT NOT NULL,
    "candyEffectPortraitUrl" TEXT NOT NULL DEFAULT '',
    "portraitScalePercent" INTEGER NOT NULL DEFAULT 100,
    "portraitOffsetXPercent" INTEGER NOT NULL DEFAULT 0,
    "portraitOffsetYPercent" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "illustName" TEXT NOT NULL DEFAULT '',
    "illustUrl" TEXT NOT NULL DEFAULT '',
    "priceCoins" INTEGER NOT NULL,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "shopVisible" BOOLEAN NOT NULL DEFAULT true,
    "purchasable" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'default',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserCostume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "costumeId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'purchase',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserCostume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserCostume_costumeId_fkey" FOREIGN KEY ("costumeId") REFERENCES "Costume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserCostumeEquipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "characterSlug" TEXT NOT NULL,
    "costumeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserCostumeEquipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserCostumeEquipment_costumeId_fkey" FOREIGN KEY ("costumeId") REFERENCES "Costume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "effectType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "uses" INTEGER NOT NULL DEFAULT 1,
    "freeTurn" BOOLEAN NOT NULL DEFAULT false,
    "targetRule" TEXT NOT NULL,
    "paramsJson" TEXT NOT NULL DEFAULT '{}',
    "costType" TEXT NOT NULL DEFAULT 'numeric',
    "costValue" TEXT NOT NULL DEFAULT '0',
    "systemMessage" TEXT NOT NULL DEFAULT '{fromColor}{player}使用了{character}的“{skill}”技能，目标是{point}。',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CharacterSkill_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkillTrait" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Decoration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ShopItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "itemTargetType" TEXT NOT NULL DEFAULT 'self',
    "stockQuantity" INTEGER NOT NULL DEFAULT -1,
    "priceCoins" INTEGER NOT NULL,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "purchasable" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "illustName" TEXT NOT NULL DEFAULT '',
    "illustUrl" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'default',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AchievementRewardAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "text" TEXT NOT NULL DEFAULT '',
    "targetType" TEXT NOT NULL DEFAULT '',
    "targetId" TEXT NOT NULL DEFAULT '',
    "amount" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "conditionType" TEXT NOT NULL,
    "conditionParams" TEXT NOT NULL DEFAULT '{}',
    "rewardAssetId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Achievement_rewardAssetId_fkey" FOREIGN KEY ("rewardAssetId") REFERENCES "AchievementRewardAsset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "achievedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewardGrantedAt" DATETIME,
    CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AchievementCounter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "targetId" TEXT NOT NULL DEFAULT '',
    "value" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AchievementCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserAchievementEquipment" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "titleAssetId" TEXT NOT NULL DEFAULT '',
    "badgeAssetId" TEXT NOT NULL DEFAULT '',
    "nameplateAssetId" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserAchievementEquipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MusicTrackSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AnnouncementEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "firstPublishedAt" DATETIME,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AnnouncementRead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnnouncementRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "AnnouncementEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryScript" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "triggerType" TEXT NOT NULL,
    "triggerParamsJson" TEXT NOT NULL DEFAULT '{}',
    "draftStartNodeId" TEXT NOT NULL DEFAULT '',
    "draftInitialBoardJson" TEXT NOT NULL DEFAULT '',
    "draftNodesJson" TEXT NOT NULL DEFAULT '[]',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedStartNodeId" TEXT NOT NULL DEFAULT '',
    "publishedInitialBoardJson" TEXT NOT NULL DEFAULT '',
    "publishedNodesJson" TEXT NOT NULL DEFAULT '[]',
    "firstPublishedAt" DATETIME,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OnboardingStoryScript" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "draftStartNodeId" TEXT NOT NULL DEFAULT '',
    "draftNodesJson" TEXT NOT NULL DEFAULT '[]',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedStartNodeId" TEXT NOT NULL DEFAULT '',
    "publishedNodesJson" TEXT NOT NULL DEFAULT '[]',
    "firstPublishedAt" DATETIME,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FeedbackMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PersistedRoom" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'active',
    "snapshot" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "RecruitmentTask_userId_status_readyAt_idx" ON "RecruitmentTask"("userId", "status", "readyAt");

-- CreateIndex
CREATE INDEX "RecruitmentTask_itemType_idx" ON "RecruitmentTask"("itemType");

-- CreateIndex
CREATE INDEX "RecruitmentMissStreak_itemType_idx" ON "RecruitmentMissStreak"("itemType");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentMissStreak_userId_itemType_key" ON "RecruitmentMissStreak"("userId", "itemType");

-- CreateIndex
CREATE INDEX "UserModeStats_mode_rating_idx" ON "UserModeStats"("mode", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "UserModeStats_userId_mode_key" ON "UserModeStats"("userId", "mode");

-- CreateIndex
CREATE UNIQUE INDEX "LoginSession_refreshTokenHash_key" ON "LoginSession"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "LoginSession_userId_revokedAt_idx" ON "LoginSession"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "LoginSession_expiresAt_idx" ON "LoginSession"("expiresAt");

-- CreateIndex
CREATE INDEX "UserCharacter_characterSlug_idx" ON "UserCharacter"("characterSlug");

-- CreateIndex
CREATE UNIQUE INDEX "UserCharacter_userId_characterSlug_key" ON "UserCharacter"("userId", "characterSlug");

-- CreateIndex
CREATE INDEX "GachaPool_enabled_sortOrder_idx" ON "GachaPool"("enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "GachaPool_startsAt_endsAt_idx" ON "GachaPool"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "GachaPrize_poolId_enabled_sortOrder_idx" ON "GachaPrize"("poolId", "enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "GachaPrize_type_targetId_idx" ON "GachaPrize"("type", "targetId");

-- CreateIndex
CREATE INDEX "GachaDraw_userId_createdAt_idx" ON "GachaDraw"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GachaDraw_poolId_createdAt_idx" ON "GachaDraw"("poolId", "createdAt");

-- CreateIndex
CREATE INDEX "GachaDrawReward_drawId_drawIndex_idx" ON "GachaDrawReward"("drawId", "drawIndex");

-- CreateIndex
CREATE INDEX "GachaDrawReward_poolId_createdAt_idx" ON "GachaDrawReward"("poolId", "createdAt");

-- CreateIndex
CREATE INDEX "GachaDrawReward_type_targetId_idx" ON "GachaDrawReward"("type", "targetId");

-- CreateIndex
CREATE INDEX "UserDecoration_decorationSlug_idx" ON "UserDecoration"("decorationSlug");

-- CreateIndex
CREATE UNIQUE INDEX "UserDecoration_userId_decorationSlug_key" ON "UserDecoration"("userId", "decorationSlug");

-- CreateIndex
CREATE INDEX "UserItem_itemId_idx" ON "UserItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "UserItem_userId_itemId_key" ON "UserItem"("userId", "itemId");

-- CreateIndex
CREATE INDEX "UserItemEffect_effectKey_idx" ON "UserItemEffect"("effectKey");

-- CreateIndex
CREATE UNIQUE INDEX "UserItemEffect_userId_effectKey_key" ON "UserItemEffect"("userId", "effectKey");

-- CreateIndex
CREATE INDEX "UserProgressLedger_userId_metric_createdAt_idx" ON "UserProgressLedger"("userId", "metric", "createdAt");

-- CreateIndex
CREATE INDEX "UserProgressLedger_refType_refId_idx" ON "UserProgressLedger"("refType", "refId");

-- CreateIndex
CREATE INDEX "MailboxBatch_targetMode_createdAt_idx" ON "MailboxBatch"("targetMode", "createdAt");

-- CreateIndex
CREATE INDEX "MailboxBatch_includeFutureUsers_createdAt_idx" ON "MailboxBatch"("includeFutureUsers", "createdAt");

-- CreateIndex
CREATE INDEX "MailboxBatch_adminUserId_createdAt_idx" ON "MailboxBatch"("adminUserId", "createdAt");

-- CreateIndex
CREATE INDEX "MailboxMessage_userId_createdAt_idx" ON "MailboxMessage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MailboxMessage_userId_isRead_idx" ON "MailboxMessage"("userId", "isRead");

-- CreateIndex
CREATE INDEX "MailboxMessage_batchId_userId_idx" ON "MailboxMessage"("batchId", "userId");

-- CreateIndex
CREATE INDEX "MailboxMessage_userId_deletedAt_createdAt_idx" ON "MailboxMessage"("userId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "UserRelationship_ownerUserId_type_idx" ON "UserRelationship"("ownerUserId", "type");

-- CreateIndex
CREATE INDEX "UserRelationship_targetUserId_idx" ON "UserRelationship"("targetUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRelationship_ownerUserId_targetUserId_key" ON "UserRelationship"("ownerUserId", "targetUserId");

-- CreateIndex
CREATE INDEX "UserProfileLike_targetUserId_idx" ON "UserProfileLike"("targetUserId");

-- CreateIndex
CREATE INDEX "UserProfileLike_likerUserId_createdAt_idx" ON "UserProfileLike"("likerUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfileLike_likerUserId_targetUserId_dayKey_key" ON "UserProfileLike"("likerUserId", "targetUserId", "dayKey");

-- CreateIndex
CREATE INDEX "UserReport_createdAt_idx" ON "UserReport"("createdAt");

-- CreateIndex
CREATE INDEX "UserReport_reporterUserId_idx" ON "UserReport"("reporterUserId");

-- CreateIndex
CREATE INDEX "UserReport_reportedUserId_idx" ON "UserReport"("reportedUserId");

-- CreateIndex
CREATE INDEX "GameRecord_blackUserId_createdAt_idx" ON "GameRecord"("blackUserId", "createdAt");

-- CreateIndex
CREATE INDEX "GameRecord_whiteUserId_createdAt_idx" ON "GameRecord"("whiteUserId", "createdAt");

-- CreateIndex
CREATE INDEX "GameRecord_mode_rated_createdAt_idx" ON "GameRecord"("mode", "rated", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Character_slug_key" ON "Character"("slug");

-- CreateIndex
CREATE INDEX "Costume_characterSlug_enabled_sortOrder_idx" ON "Costume"("characterSlug", "enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "Costume_shopVisible_purchasable_enabled_sortOrder_idx" ON "Costume"("shopVisible", "purchasable", "enabled", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "UserCostume_userId_costumeId_key" ON "UserCostume"("userId", "costumeId");

-- CreateIndex
CREATE INDEX "UserCostume_costumeId_idx" ON "UserCostume"("costumeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCostumeEquipment_userId_characterSlug_key" ON "UserCostumeEquipment"("userId", "characterSlug");

-- CreateIndex
CREATE INDEX "UserCostumeEquipment_costumeId_idx" ON "UserCostumeEquipment"("costumeId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterSkill_characterId_key" ON "CharacterSkill"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTrait_name_key" ON "SkillTrait"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Decoration_slug_key" ON "Decoration"("slug");

-- CreateIndex
CREATE INDEX "AchievementRewardAsset_type_enabled_sortOrder_idx" ON "AchievementRewardAsset"("type", "enabled", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_key_key" ON "Achievement"("key");

-- CreateIndex
CREATE INDEX "Achievement_enabled_sortOrder_idx" ON "Achievement"("enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "Achievement_conditionType_idx" ON "Achievement"("conditionType");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_achievedAt_idx" ON "UserAchievement"("userId", "achievedAt");

-- CreateIndex
CREATE INDEX "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "AchievementCounter_metric_targetId_idx" ON "AchievementCounter"("metric", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "AchievementCounter_userId_metric_targetId_key" ON "AchievementCounter"("userId", "metric", "targetId");

-- CreateIndex
CREATE INDEX "AnnouncementEntry_kind_isPublished_deletedAt_pinned_firstPublishedAt_idx" ON "AnnouncementEntry"("kind", "isPublished", "deletedAt", "pinned", "firstPublishedAt");

-- CreateIndex
CREATE INDEX "AnnouncementEntry_kind_deletedAt_createdAt_idx" ON "AnnouncementEntry"("kind", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "AnnouncementRead_userId_readAt_idx" ON "AnnouncementRead"("userId", "readAt");

-- CreateIndex
CREATE INDEX "AnnouncementRead_announcementId_idx" ON "AnnouncementRead"("announcementId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementRead_userId_announcementId_key" ON "AnnouncementRead"("userId", "announcementId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryScript_key_key" ON "StoryScript"("key");

-- CreateIndex
CREATE INDEX "StoryScript_triggerType_isPublished_idx" ON "StoryScript"("triggerType", "isPublished");

-- CreateIndex
CREATE INDEX "FeedbackMessage_createdAt_idx" ON "FeedbackMessage"("createdAt");

-- CreateIndex
CREATE INDEX "FeedbackMessage_userId_idx" ON "FeedbackMessage"("userId");

-- CreateIndex
CREATE INDEX "PersistedRoom_status_idx" ON "PersistedRoom"("status");
