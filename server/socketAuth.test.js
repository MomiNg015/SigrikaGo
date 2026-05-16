import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { USER_STATUS } from "./adminConfig.js";
import { authenticateSocketUser } from "./socketAuth.js";

describe("socket authentication", () => {
  it("rejects banned users before accepting a socket connection", async () => {
    await expect(authenticateSocketUser({
      token: jwt.sign({ sub: "user-1" }, "secret"),
      jwtSecret: "secret",
      prisma: {
        user: {
          findUnique: async () => ({
            id: "user-1",
            username: "banned-player",
            role: "player",
            status: USER_STATUS.banned,
            rank: "18k",
            rating: 1000,
            wins: 0,
            losses: 0,
            coins: 300,
            selectedCharacter: "sigrika",
            ownedCharacters: "sigrika,danea",
            ownedItems: "",
            ownedDecorations: ""
          })
        }
      },
      characterSelectionData: async () => ({ characters: {}, disabledSlugs: new Set() })
    })).rejects.toThrow("forbidden");
  });
});
