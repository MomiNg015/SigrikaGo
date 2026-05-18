import { describe, expect, test } from "vitest";
import { publicUserWithRecordStats } from "./userProfile.js";

describe("public user profile stats", () => {
  test("keeps stored rating while deriving record counts from game records", () => {
    const user = {
      id: "user-1",
      username: "moming",
      passwordHash: "hidden",
      role: "player",
      status: "active",
      rank: "18级",
      rating: 960,
      wins: 0,
      losses: 0,
      coins: 300,
      selectedCharacter: "sigrika",
      ownedCharacters: "sigrika",
      ownedItems: "",
      ownedDecorations: ""
    };
    const records = [
      { blackUserId: "user-1", whiteUserId: "other-1", winnerColor: "black", resultText: "黑胜" },
      { blackUserId: "other-2", whiteUserId: "user-1", winnerColor: "black", resultText: "黑胜" },
      { blackUserId: "user-1", whiteUserId: "other-3", winnerColor: null, resultText: "和棋" }
    ];

    const profile = publicUserWithRecordStats(user, records);

    expect(profile.passwordHash).toBeUndefined();
    expect(profile.totalGames).toBe(3);
    expect(profile.wins).toBe(1);
    expect(profile.losses).toBe(1);
    expect(profile.draws).toBe(1);
    expect(profile.rating).toBe(960);
  });
});
