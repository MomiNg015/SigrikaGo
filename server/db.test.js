import { describe, expect, it } from "vitest";
import { publicUser } from "./db.js";

describe("publicUser", () => {
  it("exposes safe role and status fields without password hash", () => {
    const user = {
      id: "u1",
      username: "admin",
      passwordHash: "secret",
      role: "admin",
      status: "active",
      rank: "18级",
      rating: 1000,
      wins: 1,
      losses: 2,
      coins: 300,
      selectedCharacter: "sigrika",
      ownedCharacters: "sigrika,danea",
      ownedItems: "",
      ownedDecorations: ""
    };

    expect(publicUser(user)).toEqual({
      id: "u1",
      username: "admin",
      role: "admin",
      status: "active",
      rank: "18级",
      rating: 1000,
      wins: 1,
      losses: 2,
      coins: 300,
      selectedCharacter: "sigrika",
      ownedCharacters: ["sigrika", "danea", "aemeath"],
      ownedItems: [],
      ownedDecorations: []
    });
  });
});
