import { describe, expect, it } from "vitest";
import { buildLeaderboard } from "./leaderboard.js";

describe("leaderboard", () => {
  it("lists users with finished games, sorted by rating, and picks the most used character", () => {
    const users = [
      { id: "u1", username: "alice", rating: 1040, selectedCharacter: "sigrika" },
      { id: "u2", username: "bob", rating: 1000, selectedCharacter: "danea" },
      { id: "u3", username: "cora", rating: 1080, selectedCharacter: "aemeath" },
      { id: "u4", username: "idle", rating: 1200, selectedCharacter: "sigrika" }
    ];
    const records = [
      {
        blackUserId: "u1",
        whiteUserId: "u2",
        blackCharacter: "danea",
        whiteCharacter: "sigrika",
        resultText: "黑胜3.25子"
      },
      {
        blackUserId: "u2",
        whiteUserId: "u1",
        blackCharacter: "aemeath",
        whiteCharacter: "danea",
        resultText: "白中盘胜"
      },
      {
        blackUserId: "u3",
        whiteUserId: "u1",
        blackCharacter: "aemeath",
        whiteCharacter: "sigrika",
        resultText: "和棋"
      }
    ];

    expect(buildLeaderboard(users, records)).toEqual([
      {
        id: "u3",
        username: "cora",
        rating: 1080,
        rank: "2段",
        itemEffects: {},
        totalGames: 1,
        wins: 0,
        losses: 0,
        commonCharacter: "aemeath"
      },
      {
        id: "u1",
        username: "alice",
        rating: 1040,
        rank: "2段",
        itemEffects: {},
        totalGames: 3,
        wins: 2,
        losses: 0,
        commonCharacter: "danea"
      },
      {
        id: "u2",
        username: "bob",
        rating: 1000,
        rank: "2段",
        itemEffects: {},
        totalGames: 2,
        wins: 0,
        losses: 2,
        commonCharacter: "sigrika"
      }
    ]);
  });
});
