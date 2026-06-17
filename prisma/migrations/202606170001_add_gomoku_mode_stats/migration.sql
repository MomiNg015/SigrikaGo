INSERT OR IGNORE INTO "UserModeStats" (
  "id",
  "userId",
  "mode",
  "rating",
  "rank",
  "recentResults",
  "wins",
  "losses",
  "draws",
  "createdAt",
  "updatedAt"
)
SELECT
  "id" || ':gomoku',
  "id",
  'gomoku',
  1000,
  '3段',
  '',
  0,
  0,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User";
