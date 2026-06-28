ALTER TABLE "User" ADD COLUMN "onboardingRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "onboardingAutoShownAt" DATETIME;

CREATE TABLE IF NOT EXISTS "OnboardingStoryScript" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "draftStartNodeId" TEXT NOT NULL DEFAULT '',
  "draftNodesJson" TEXT NOT NULL DEFAULT '[]',
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "publishedStartNodeId" TEXT NOT NULL DEFAULT '',
  "publishedNodesJson" TEXT NOT NULL DEFAULT '[]',
  "firstPublishedAt" DATETIME,
  "publishedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
