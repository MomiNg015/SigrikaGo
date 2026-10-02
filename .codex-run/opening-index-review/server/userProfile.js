import { publicUser } from "./db.js";
import { derivePlayerRecordStats } from "./gameRecords.js";

export function publicUserWithRecordStats(user, records = []) {
  const stats = derivePlayerRecordStats(user, records);
  return {
    ...publicUser(user),
    totalGames: stats.totalGames,
    wins: stats.wins,
    losses: stats.losses,
    draws: stats.draws,
    rating: user.rating
  };
}
