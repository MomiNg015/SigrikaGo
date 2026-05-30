import { recordWinnerColor } from "./gameRecords.js";
import { parseItemEffects } from "./itemEffects.js";
import { rankFromRating } from "../src/shared/ratingRank.js";

export function buildLeaderboard(users = [], records = []) {
  const rows = new Map();
  for (const user of users) {
    rows.set(user.id, {
      id: user.id,
      username: user.username,
      rating: user.rating ?? 1000,
      selectedCharacter: user.selectedCharacter ?? "sigrika",
      itemEffects: parseItemEffects(user.itemEffects),
      totalGames: 0,
      wins: 0,
      losses: 0,
      characterCounts: new Map()
    });
  }

  for (const record of records) {
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
      rank: rankFromRating(row.rating),
      itemEffects: row.itemEffects,
      totalGames: row.totalGames,
      wins: row.wins,
      losses: row.losses,
      commonCharacter: mostUsedCharacter(row.characterCounts) ?? row.selectedCharacter
    }))
    .sort((a, b) => b.rating - a.rating || b.wins - a.wins || a.username.localeCompare(b.username));
}

function addGame(row, characterId, winnerColor, playerColor) {
  if (!row) return;
  row.totalGames += 1;
  if (winnerColor === playerColor) row.wins += 1;
  else if (winnerColor) row.losses += 1;
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
