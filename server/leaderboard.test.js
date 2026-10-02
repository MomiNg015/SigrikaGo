import { describe, expect, it } from "vitest";
import { buildLeaderboard } from "./leaderboard.js";

describe("leaderboard", () => {
  it.each(["3段", "9段"])("orders equal %s progress by exact win rate then wins and shares rankings", (rank) => {
    const users = ["a", "b", "c", "d", "e"].map((id) => ({ id, username: id, rank, stars: 2, rating: 1000 }));
    const games = (id, wins, total) => Array.from({ length: total }, (_, index) => ({
      blackUserId: id, whiteUserId: "outsider", winnerColor: index < wins ? "black" : "white", resultText: index < wins ? "黑中盘胜" : "白中盘胜"
    }));
    const rows = buildLeaderboard(users, [...games("a", 1, 3), ...games("b", 1, 2), ...games("c", 2, 4), ...games("d", 2, 4), ...games("e", 3, 4)]);
    expect(rows.map(({ id, ranking }) => [id, ranking])).toEqual([["e", 1], ["c", 2], ["d", 2], ["b", 4], ["a", 5]]);
  });
  it("lists users with finished games, sorted by rank progress, and picks the most used character", () => {
    const users = [
      { id: "u1", username: "alice", rating: 1040, stars: 3, selectedCharacter: "sigrika" },
      { id: "u2", username: "bob", rating: 1000, stars: 2, selectedCharacter: "danea" },
      { id: "u3", username: "cora", rating: 1080, stars: 4, selectedCharacter: "aemeath" },
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
        ranking: 1,
        rating: 1080, stars: 4,
        rank: "3段",
        itemEffects: {},
        equippedCostumes: {},
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
        ranking: 2,
        rating: 1040, stars: 3,
        rank: "3段",
        itemEffects: {},
        equippedCostumes: {},
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
        ranking: 3,
        rating: 1000, stars: 2,
        rank: "3段",
        itemEffects: {},
        equippedCostumes: {},
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
      rating: 1040, stars: 3,
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
        rating: 1040, stars: 3,
        selectedCharacter: "sigrika",
        modeStats: [
          { mode: "spark", rating: 1040, stars: 3, rank: "3段", wins: 2, losses: 1, draws: 0 },
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
      { id: "u1", username: "alice", rating: 1040, stars: 3, selectedCharacter: "sigrika" },
      { id: "u2", username: "bob", rating: 1000, stars: 2, selectedCharacter: "danea" }
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
