import { recordWinnerColor } from "./gameRecords.js";
import { publicUser } from "./db.js";
import { normalizeGameModeId } from "../src/shared/gameModes.js";
import { DEFAULT_RANK, normalizeRank } from "../src/shared/rankProgression.js";

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
      rank: stats.rank,
      selectedCharacter: profile.selectedCharacter ?? "sigrika",
      itemEffects: profile.itemEffects,
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
    const winnerColor = recordWinnerColor(record);
    addGame(rows.get(record.blackUserId), record.blackCharacter, winnerColor, "black");
    addGame(rows.get(record.whiteUserId), record.whiteCharacter, winnerColor, "white");
  }

  return [...rows.values()]
    .filter((row) => row.totalGames > 0)
    .map((row) => ({
      id: row.id,
      username: row.username,
      rating: row.rating,
      rank: row.rank,
      itemEffects: row.itemEffects,
      achievementEquipment: row.achievementEquipment,
      achievementEquipmentAssets: row.achievementEquipmentAssets,
      totalGames: row.totalGames,
      wins: row.wins,
      losses: row.losses,
      draws: row.draws,
      commonCharacter: mostUsedCharacter(row.characterCounts) ?? row.selectedCharacter
    }))
    .sort((a, b) => b.rating - a.rating || b.wins - a.wins || a.username.localeCompare(b.username));
}

function modeStatsForUser(user, mode) {
  const stats = Array.isArray(user.modeStats)
    ? user.modeStats.find((entry) => normalizeGameModeId(entry.mode) === mode)
    : user.modeStats?.[mode] ?? null;
  return {
    rating: Number(stats?.rating ?? user.rating ?? 1000),
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
