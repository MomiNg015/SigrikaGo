import { describe, expect, it } from "vitest";
import { applyResultRewardsToRoomUsers, applyUserReward } from "./roomRewards.js";

describe("room rewards", () => {
  it("applies rating coins and record deltas to room users", () => {
    const user = {
      wins: 2,
      losses: 3,
      rating: 1000,
      rank: "3段",
      modeStats: {
        spark: { rating: 1000, rank: "3段", recentResults: ["win", "loss"], wins: 2, losses: 3, draws: 0 }
      },
      coins: 10
    };

    expect(applyUserReward(user, { rating: 20, coins: 50 }, { wins: 1 })).toMatchObject({
      wins: 3,
      losses: 3,
      rating: 1020,
      rank: "3段",
      modeStats: {
        spark: expect.objectContaining({ recentResults: ["win", "loss", "win"] })
      },
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

  it("promotes and clears the recent window after the seventh win", () => {
    const user = {
      wins: 6,
      losses: 1,
      rating: 1000,
      rank: "3段",
      modeStats: {
        spark: {
          rating: 1000,
          rank: "3段",
          recentResults: ["win", "win", "loss", "win", "win", "win", "win"],
          wins: 6,
          losses: 1,
          draws: 0
        }
      },
      coins: 0
    };

    const nextUser = applyUserReward(user, { rating: 20, coins: 50 }, { wins: 1 });

    expect(nextUser.rating).toBe(1120);
    expect(nextUser.modeStats.spark.rating).toBe(1120);
    expect(nextUser.modeStats.spark.recentResults).toEqual([]);
    expect(nextUser.modeStats.spark.rank).not.toBe(user.modeStats.spark.rank);
  });

  it("applies draw rating without changing the recent rank window", () => {
    const user = {
      wins: 1,
      losses: 1,
      rating: 1000,
      rank: "3段",
      modeStats: {
        spark: { rating: 1000, rank: "3段", recentResults: ["win", "loss"], wins: 1, losses: 1, draws: 0 }
      },
      coins: 0
    };

    expect(applyUserReward(user, { rating: 6, coins: 0 }, { draws: 1 })).toMatchObject({
      rating: 1006,
      modeStats: {
        spark: expect.objectContaining({ rating: 1006, draws: 1, recentResults: ["win", "loss"] })
      }
    });
  });
});
