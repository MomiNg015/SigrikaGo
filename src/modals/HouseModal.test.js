import { describe, expect, it } from "vitest";
import { deriveCharacterRecordStats } from "./HouseModal.jsx";

describe("deriveCharacterRecordStats", () => {
  const user = {
    id: 1,
    username: "moming",
    ownedCharacters: ["sigrika", "aemeath"]
  };
  const characters = [
    { id: "sigrika", name: "西格莉卡" },
    { id: "aemeath", name: "爱弥斯" },
    { id: "baconbits", name: "猪小仙" }
  ];

  it("counts only owned character records for the viewed player", () => {
    const records = [
      { blackUserId: 1, blackCharacter: "sigrika", winnerColor: "black" },
      { whiteUserId: 1, whiteCharacter: "aemeath", winnerColor: "black" },
      { blackName: "moming", blackCharacter: "baconbits", winnerColor: "black" },
      { whiteUserId: 2, whiteCharacter: "sigrika", winnerColor: "white" }
    ];

    expect(deriveCharacterRecordStats(user, records, characters)).toEqual([
      { character: characters[0], total: 1, wins: 1, losses: 0, draws: 0 },
      { character: characters[1], total: 1, wins: 0, losses: 1, draws: 0 }
    ]);
  });
});
