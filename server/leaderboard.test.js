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
        rank: "3段",
        itemEffects: {},
        achievementEquipment: null,
        achievementEquipmentAssets: null,
        totalGames: 1,
        wins: 0,
        losses: 0,
        draws: 1,
        commonCharacter: "aemeath"
      },
      {
        id: "u1",
        username: "alice",
        rating: 1040,
        rank: "3段",
        itemEffects: {},
        achievementEquipment: null,
        achievementEquipmentAssets: null,
        totalGames: 3,
        wins: 2,
        losses: 0,
        draws: 1,
        commonCharacter: "danea"
      },
      {
        id: "u2",
        username: "bob",
        rating: 1000,
        rank: "3段",
        itemEffects: {},
        achievementEquipment: null,
        achievementEquipmentAssets: null,
        totalGames: 2,
        wins: 0,
        losses: 2,
        draws: 0,
        commonCharacter: "sigrika"
      }
    ]);
  });

  it("prefers structured item effects over legacy strings", () => {
    const users = [{
      id: "u1",
      username: "alice",
      rating: 1040,
      selectedCharacter: "denia",
      itemEffects: JSON.stringify({ legacyEffect: true }),
      userItemEffects: [
        { effectKey: "deniaRainbowGlow", effectValue: "true" },
        { effectKey: "inactive", effectValue: "false" }
      ]
    }];
    const records = [{
      blackUserId: "u1",
      whiteUserId: "u2",
      blackCharacter: "denia",
      whiteCharacter: "sigrika",
      resultText: "黑中盘胜"
    }];

    expect(buildLeaderboard(users, records)[0].itemEffects).toEqual({ deniaRainbowGlow: true });
  });

  it("filters records and rating by mode-specific stats", () => {
    const users = [
      {
        id: "u1",
        username: "alice",
        rating: 1040,
        selectedCharacter: "sigrika",
        modeStats: [
          { mode: "spark", rating: 1040, rank: "3段", wins: 2, losses: 1, draws: 0 },
          { mode: "standard", rating: 1120, rank: "4段", wins: 1, losses: 0, draws: 0 }
        ]
      },
      {
        id: "u2",
        username: "bob",
        rating: 980,
        selectedCharacter: "denia",
        modeStats: [
          { mode: "spark", rating: 980, rank: "3段", wins: 1, losses: 2, draws: 0 },
          { mode: "standard", rating: 960, rank: "2段", wins: 0, losses: 1, draws: 0 }
        ]
      }
    ];
    const records = [
      {
        mode: "spark",
        blackUserId: "u1",
        whiteUserId: "u2",
        blackCharacter: "sigrika",
        whiteCharacter: "denia",
        winnerColor: "black"
      },
      {
        mode: "standard",
        blackUserId: "u1",
        whiteUserId: "u2",
        blackCharacter: "sigrika",
        whiteCharacter: "denia",
        winnerColor: "black"
      }
    ];

    expect(buildLeaderboard(users, records, { mode: "standard" })).toEqual([
      expect.objectContaining({
        id: "u1",
        rating: 1120,
        rank: "4段",
        totalGames: 1,
        wins: 1,
        losses: 0,
        draws: 0
      }),
      expect.objectContaining({
        id: "u2",
        rating: 960,
        rank: "2段",
        totalGames: 1,
        wins: 0,
        losses: 1,
        draws: 0
      })
    ]);
  });

  it("ignores unrated friendly records", () => {
    const users = [
      { id: "u1", username: "alice", rating: 1040, selectedCharacter: "sigrika" },
      { id: "u2", username: "bob", rating: 1000, selectedCharacter: "danea" }
    ];
    const records = [
      {
        rated: false,
        blackUserId: "u1",
        whiteUserId: "u2",
        blackCharacter: "sigrika",
        whiteCharacter: "danea",
        winnerColor: "black"
      }
    ];

    expect(buildLeaderboard(users, records)).toEqual([]);
  });
});
