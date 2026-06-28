CREATE TABLE IF NOT EXISTS "StoryScript" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL,
  "title" TEXT NOT NULL DEFAULT '',
  "triggerType" TEXT NOT NULL,
  "triggerParamsJson" TEXT NOT NULL DEFAULT '{}',
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

CREATE UNIQUE INDEX IF NOT EXISTS "StoryScript_key_key" ON "StoryScript"("key");
CREATE INDEX IF NOT EXISTS "StoryScript_triggerType_isPublished_idx" ON "StoryScript"("triggerType", "isPublished");
