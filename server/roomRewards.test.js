import { describe, expect, it } from "vitest";
import { rankFromRating } from "../src/shared/ratingRank.js";
import { applyResultRewardsToRoomUsers, applyUserReward } from "./roomRewards.js";

describe("room rewards", () => {
  it("applies rating coins and record deltas to room users", () => {
    const user = {
      wins: 2,
      losses: 3,
      rating: 1000,
      rank: rankFromRating(1000),
      coins: 10
    };

    expect(applyUserReward(user, { rating: 20, coins: 50 }, { wins: 1 })).toMatchObject({
      wins: 3,
      losses: 3,
      rating: 1020,
      rank: rankFromRating(1020),
      coins: 60
    });
  });

  it("updates winner and loser user objects in place on their player wrappers", () => {
    const winner = { user: { wins: 0, losses: 0, rating: 1000, coins: 0 } };
    const loser = { user: { wins: 0, losses: 0, rating: 1000, coins: 0 } };

    applyResultRewardsToRoomUsers(
      winner,
      loser,
      { rating: 20, coins: 50 },
      { rating: -20, coins: 20 }
    );

    expect(winner.user).toMatchObject({ wins: 1, rating: 1020, coins: 50 });
    expect(loser.user).toMatchObject({ losses: 1, rating: 980, coins: 20 });
  });
});
