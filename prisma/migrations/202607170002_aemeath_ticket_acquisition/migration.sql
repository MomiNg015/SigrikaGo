ALTER TABLE "User" ADD COLUMN "welcomeMailNoticeShownAt" DATETIME;

UPDATE "User"
SET "ownedCharacters" = CASE
  WHEN TRIM(COALESCE("ownedCharacters", '')) = '' THEN 'aemeath'
  ELSE RTRIM("ownedCharacters", ',') || ',aemeath'
END
WHERE ',' || REPLACE(COALESCE("ownedCharacters", ''), ' ', '') || ',' NOT LIKE '%,aemeath,%';

INSERT OR IGNORE INTO "UserCharacter" (
  "id",
  "userId",
  "characterSlug",
  "chainCount",
  "source",
  "createdAt",
  "updatedAt"
)
SELECT
  LOWER(HEX(RANDOMBLOB(16))),
  "id",
  'aemeath',
  0,
  'legacy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User";
