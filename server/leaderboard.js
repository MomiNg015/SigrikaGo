import { recordWinnerColor } from "./gameRecords.js";
import { publicUser } from "./db.js";
import { normalizeGameModeId } from "../src/shared/gameModes.js";
import { DEFAULT_RANK, normalizeRank, compareRankProgress } from "../src/shared/rankProgression.js";

export function buildLeaderboard(users = [], records = [], options = {}) {
  const mode = normalizeGameModeId(options.mode);
  const rows = new Map();
  for (const user of users) {
    const profile = publicUser(user);
    const stats = modeStatsForUser(user, mode);
    rows.set(user.id, {
      id: profile.id,
      username: profile.username,
      rating: stats.rating,
      stars: stats.stars,
      rank: stats.rank,
      selectedCharacter: profile.selectedCharacter ?? "sigrika",
      itemEffects: profile.itemEffects,
      equippedCostumes: profile.equippedCostumes,
      achievementEquipment: user.achievementEquipment ?? null,
      achievementEquipmentAssets: user.achievementEquipmentAssets ?? null,
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      characterCounts: new Map()
    });
  }

  for (const record of records) {
    if (normalizeGameModeId(record.mode) !== mode) continue;
    if (record.rated === false) continue;
    const winnerColor = recordWinnerColor(record);
    addGame(rows.get(record.blackUserId), record.blackCharacter, winnerColor, "black");
    addGame(rows.get(record.whiteUserId), record.whiteCharacter, winnerColor, "white");
  }

  const sorted = [...rows.values()]
    .filter((row) => row.totalGames > 0)
    .map((row) => ({
      id: row.id,
      username: row.username,
      rating: row.rating,
      stars: row.stars,
      rank: row.rank,
      itemEffects: row.itemEffects,
      equippedCostumes: row.equippedCostumes,
      achievementEquipment: row.achievementEquipment,
      achievementEquipmentAssets: row.achievementEquipmentAssets,
      totalGames: row.totalGames,
      wins: row.wins,
      losses: row.losses,
      draws: row.draws,
      commonCharacter: mostUsedCharacter(row.characterCounts) ?? row.selectedCharacter
    }))
    .sort((a, b) => compareLeaderboardStanding(a, b) || a.username.localeCompare(b.username) || a.id.localeCompare(b.id));
  let ranking = 0;
  return sorted.map((row, index) => {
    if (!index || compareLeaderboardStanding(sorted[index - 1], row) !== 0) ranking = index + 1;
    return { ...row, ranking };
  });
}

function compareLeaderboardStanding(a, b) {
  return compareRankProgress(a, b)
    || (b.wins * a.totalGames - a.wins * b.totalGames)
    || b.wins - a.wins;
}

function modeStatsForUser(user, mode) {
  const stats = Array.isArray(user.modeStats)
    ? user.modeStats.find((entry) => normalizeGameModeId(entry.mode) === mode)
    : user.modeStats?.[mode] ?? null;
  return {
    rating: Number(stats?.rating ?? (mode === "spark" ? user.rating : 0) ?? 0),
    stars: Number(stats?.stars ?? (mode === "spark" ? user.stars : 2) ?? 2),
    rank: normalizeRank(stats?.rank ?? (mode === "spark" ? user.rank : DEFAULT_RANK))
  };
}

function addGame(row, characterId, winnerColor, playerColor) {
  if (!row) return;
  row.totalGames += 1;
  if (winnerColor === playerColor) row.wins += 1;
  else if (winnerColor) row.losses += 1;
  else row.draws += 1;
  if (characterId) {
    row.characterCounts.set(characterId, (row.characterCounts.get(characterId) ?? 0) + 1);
  }
}

function mostUsedCharacter(counts) {
  let best = null;
  for (const [characterId, count] of counts) {
    if (!best || count > best.count) best = { characterId, count };
  }
  return best?.characterId ?? null;
}
