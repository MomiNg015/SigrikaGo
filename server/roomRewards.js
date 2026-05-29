import { rankFromRating } from "../src/shared/ratingRank.js";

export function applyResultRewardsToRoomUsers(winner, loser, winnerReward, loserReward) {
  winner.user = applyUserReward(winner.user, winnerReward, { wins: 1 });
  loser.user = applyUserReward(loser.user, loserReward, { losses: 1 });
}

export function applyUserReward(user, reward, recordDelta) {
  const rating = Number(user.rating ?? 0) + reward.rating;
  return {
    ...user,
    wins: Number(user.wins ?? 0) + (recordDelta.wins ?? 0),
    losses: Number(user.losses ?? 0) + (recordDelta.losses ?? 0),
    rating,
    rank: rankFromRating(rating),
    coins: Number(user.coins ?? 0) + reward.coins
  };
}
