import { normalizeGameModeId } from "../src/shared/gameModes.js";
import {
  DEFAULT_RANK,
  applyRankProgression,
  normalizeRank,
  parseRecentResults,
  serializeRecentResults
} from "../src/shared/rankProgression.js";
import { normalizeRatingRules } from "../src/shared/ratingRules.js";

export function applyResultRewardsToRoomUsers(winner, loser, winnerReward, loserReward, { mode = "spark", rules } = {}) {
  winner.user = applyUserReward(winner.user, winnerReward, { wins: 1 }, { mode, rules });
  loser.user = applyUserReward(loser.user, loserReward, { losses: 1 }, { mode, rules });
}

export function applyUserReward(user, reward, recordDelta, { mode = "spark", rules } = {}) {
  const normalizedMode = normalizeGameModeId(mode);
  const normalizedRules = normalizeRatingRules(rules);
  const currentModeStats = modeStatsForUser(user, normalizedMode);
  const wins = Number(currentModeStats.wins ?? 0) + (recordDelta.wins ?? 0);
  const losses = Number(currentModeStats.losses ?? 0) + (recordDelta.losses ?? 0);
  const draws = Number(currentModeStats.draws ?? 0) + (recordDelta.draws ?? 0);
  const progression = applyRankProgression({
    rank: currentModeStats.rank,
    recentResults: currentModeStats.recentResults,
    outcome: recordDelta.wins ? "win" : recordDelta.losses ? "loss" : ""
  });
  const rankRatingDelta = progression.triggered
    ? (progression.direction === "up" ? normalizedRules.rankChangeRatingDelta : -normalizedRules.rankChangeRatingDelta)
    : 0;
  const rating = Number(currentModeStats.rating ?? 0) + reward.rating + rankRatingDelta;
  const modeStats = {
    ...(user.modeStats ?? {}),
    [normalizedMode]: {
      rating,
      rank: progression.rank,
      recentResults: progression.recentResults,
      wins,
      losses,
      draws
    }
  };
  return {
    ...user,
    wins: normalizedMode === "spark" ? wins : Number(user.wins ?? 0),
    losses: normalizedMode === "spark" ? losses : Number(user.losses ?? 0),
    rating: normalizedMode === "spark" ? rating : Number(user.rating ?? 0),
    rank: normalizedMode === "spark" ? progression.rank : normalizeRank(user.rank ?? DEFAULT_RANK),
    coins: Number(user.coins ?? 0) + reward.coins,
    modeStats
  };
}

function modeStatsForUser(user, mode) {
  if (user.modeStats?.[mode]) return normalizeModeStats(user.modeStats[mode], user, mode);
  const row = Array.isArray(user.modeStats)
    ? user.modeStats.find((entry) => normalizeGameModeId(entry.mode) === mode)
    : null;
  return normalizeModeStats(row, user, mode);
}

function normalizeModeStats(row, user, mode) {
  const fallback = {
    rating: mode === "spark" ? Number(user.rating ?? 1000) : 1000,
    rank: normalizeRank(mode === "spark" ? user.rank : DEFAULT_RANK),
    recentResults: [],
    wins: mode === "spark" ? Number(user.wins ?? 0) : 0,
    losses: mode === "spark" ? Number(user.losses ?? 0) : 0,
    draws: 0
  };
  const stats = row ?? fallback;
  return {
    ...fallback,
    ...stats,
    rank: normalizeRank(stats.rank ?? fallback.rank),
    recentResults: parseRecentResults(stats.recentResults ?? serializeRecentResults(stats.recentResults))
  };
}
