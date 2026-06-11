import { rankFromRating } from "../src/shared/ratingRank.js";
import { normalizeGameModeId } from "../src/shared/gameModes.js";

export function applyResultRewardsToRoomUsers(winner, loser, winnerReward, loserReward, { mode = "spark" } = {}) {
  winner.user = applyUserReward(winner.user, winnerReward, { wins: 1 }, { mode });
  loser.user = applyUserReward(loser.user, loserReward, { losses: 1 }, { mode });
}

export function applyUserReward(user, reward, recordDelta, { mode = "spark" } = {}) {
  const normalizedMode = normalizeGameModeId(mode);
  const currentModeStats = modeStatsForUser(user, normalizedMode);
  const rating = Number(currentModeStats.rating ?? 0) + reward.rating;
  const wins = Number(currentModeStats.wins ?? 0) + (recordDelta.wins ?? 0);
  const losses = Number(currentModeStats.losses ?? 0) + (recordDelta.losses ?? 0);
  const modeStats = {
    ...(user.modeStats ?? {}),
    [normalizedMode]: {
      rating,
      wins,
      losses,
      draws: Number(currentModeStats.draws ?? 0)
    }
  };
  return {
    ...user,
    wins: normalizedMode === "spark" ? wins : Number(user.wins ?? 0),
    losses: normalizedMode === "spark" ? losses : Number(user.losses ?? 0),
    rating: normalizedMode === "spark" ? rating : Number(user.rating ?? 0),
    rank: rankFromRating(rating),
    coins: Number(user.coins ?? 0) + reward.coins,
    modeStats
  };
}

function modeStatsForUser(user, mode) {
  if (user.modeStats?.[mode]) return user.modeStats[mode];
  const row = Array.isArray(user.modeStats)
    ? user.modeStats.find((entry) => normalizeGameModeId(entry.mode) === mode)
    : null;
  return row ?? {
    rating: mode === "spark" ? Number(user.rating ?? 1000) : 1000,
    wins: mode === "spark" ? Number(user.wins ?? 0) : 0,
    losses: mode === "spark" ? Number(user.losses ?? 0) : 0,
    draws: 0
  };
}
