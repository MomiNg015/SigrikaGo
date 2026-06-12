ALTER TABLE "UserModeStats" ADD COLUMN "rank" TEXT NOT NULL DEFAULT '3段';
ALTER TABLE "UserModeStats" ADD COLUMN "recentResults" TEXT NOT NULL DEFAULT '';

UPDATE "UserModeStats"
SET "rank" = CASE
  WHEN "rating" >= 1700 THEN '9段'
  WHEN "rating" >= 1600 THEN '8段'
  WHEN "rating" >= 1500 THEN '7段'
  WHEN "rating" >= 1400 THEN '6段'
  WHEN "rating" >= 1300 THEN '5段'
  WHEN "rating" >= 1200 THEN '4段'
  WHEN "rating" >= 1100 THEN '3段'
  WHEN "rating" >= 1000 THEN '2段'
  WHEN "rating" >= 900 THEN '1段'
  WHEN "rating" >= 800 THEN '1级'
  WHEN "rating" >= 700 THEN '2级'
  WHEN "rating" >= 600 THEN '3级'
  WHEN "rating" >= 500 THEN '4级'
  WHEN "rating" >= 400 THEN '5级'
  WHEN "rating" >= 300 THEN '6级'
  WHEN "rating" >= 200 THEN '7级'
  WHEN "rating" >= 100 THEN '8级'
  WHEN "rating" >= 0 THEN '9级'
  ELSE '10级'
END
WHERE "rank" IS NULL OR "rank" = '' OR "rank" = '3段';
