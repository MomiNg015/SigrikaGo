import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { USER_STATUS } from "./adminConfig.js";
import { authenticateSocketUser, createSocketUserRefresher } from "./socketAuth.js";

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
            itemEffects: "",
            ownedDecorations: ""
          })
        }
      },
      characterSelectionData: async () => ({ characters: {}, disabledSlugs: new Set() })
    })).rejects.toThrow("forbidden");
  });

  it("falls back from Sigrika when candy effects block sortie", async () => {
    const result = await authenticateSocketUser({
      token: jwt.sign({ sub: "user-1" }, "secret"),
      jwtSecret: "secret",
      prisma: {
        user: {
          findUnique: async () => ({
            id: "user-1",
            username: "candy-player",
            role: "player",
            status: USER_STATUS.active,
            rank: "2段",
            rating: 1000,
            wins: 0,
            losses: 0,
            coins: 300,
            selectedCharacter: "sigrika",
            ownedCharacters: "sigrika,danea",
            ownedItems: "",
            itemEffects: JSON.stringify({ sigrikaCandyDisabled: true }),
            ownedDecorations: ""
          })
        }
      },
      characterSelectionData: async () => ({ characters: {}, disabledSlugs: new Set() })
    });

    expect(result.selectedCharacter).toBe("denia");
  });

  it("refreshes a connected socket user from the latest database character before matchmaking", async () => {
    const socket = {
      handshake: { auth: { token: jwt.sign({ sub: "user-1" }, "secret") } },
      user: {
        id: "user-1",
        username: "fresh-player",
        selectedCharacter: "sigrika"
      }
    };
    const refreshSocketUser = createSocketUserRefresher({
      jwtSecret: "secret",
      prisma: {
        user: {
          findUnique: async () => ({
            id: "user-1",
            username: "fresh-player",
            role: "player",
            status: USER_STATUS.active,
            rank: "2段",
            rating: 1000,
            wins: 0,
            losses: 0,
            coins: 300,
            selectedCharacter: "denia",
            ownedCharacters: "sigrika,danea",
            ownedItems: "",
            itemEffects: "",
            ownedDecorations: ""
          })
        }
      },
      characterSelectionData: async () => ({ characters: {}, disabledSlugs: new Set() })
    });

    const refreshed = await refreshSocketUser(socket);

    expect(refreshed.selectedCharacter).toBe("denia");
    expect(socket.user.selectedCharacter).toBe("denia");
  });

  it("rejects stale login sessions", async () => {
    await expect(authenticateSocketUser({
      token: jwt.sign({ sub: "user-1", sid: "old-session" }, "secret"),
      jwtSecret: "secret",
      prisma: {
        user: {
          findUnique: async () => ({
            id: "user-1",
            username: "stale-player",
            role: "player",
            status: USER_STATUS.active,
            rank: "2段",
            rating: 1000,
            wins: 0,
            losses: 0,
            coins: 300,
            selectedCharacter: "sigrika",
            ownedCharacters: "sigrika,danea",
            ownedItems: "",
            itemEffects: "",
            ownedDecorations: ""
          })
        }
      },
      characterSelectionData: async () => ({ characters: {}, disabledSlugs: new Set() }),
      isSessionActive: () => false
    })).rejects.toThrow("unauthorized");
  });
});
