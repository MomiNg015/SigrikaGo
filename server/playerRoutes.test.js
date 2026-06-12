import { describe, expect, it } from "vitest";
import {
  createCharacterSelectionData,
  createPlayerRouteHandlers,
  validateOptionalRoomCode
} from "./playerRoutes.js";

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

describe("player route helpers", () => {
  it("normalizes optional resume room codes before hitting resume logic", async () => {
    let payloadArgs = null;
    const handlers = createPlayerRouteHandlers({
      prisma: { gameRecord: { findMany: async () => [] } },
      findRoomForUser: () => null,
      roomView: () => ({}),
      characterSelectionData: async () => ({ characters: {}, disabledSlugs: new Set() }),
      resumePayloadForUserFn: async (args) => {
        payloadArgs = args;
        return { type: "none" };
      }
    });
    const res = createResponse();

    await handlers.resume({
      user: { id: "user-1" },
      query: { roomCode: "<bad>" }
    }, res);

    expect(payloadArgs.roomCode).toBe("");
    expect(res.body).toEqual({ type: "none" });
  });

  it("keeps the socket-safe room code normalizer export focused", () => {
    expect(validateOptionalRoomCode(" 12345 ")).toBe("12345");
    expect(validateOptionalRoomCode("<bad>")).toBe("");
    expect(validateOptionalRoomCode()).toBe("");
  });

  it("builds selectable characters with disabled slugs", async () => {
    const characterSelectionData = createCharacterSelectionData({
      prisma: {
        character: {
          findMany: async () => [
            { slug: "sigrika", enabled: true },
            { slug: "denia", enabled: false }
          ]
        }
      },
      listCharacters: async () => [{ id: "sigrika", name: "Sigrika" }]
    });

    await expect(characterSelectionData()).resolves.toEqual({
      characters: { sigrika: { id: "sigrika", name: "Sigrika" } },
      disabledSlugs: new Set(["denia"])
    });
  });

  it("rejects owned but currently blocked character selections", async () => {
    const updatedUsers = [];
    const handlers = createPlayerRouteHandlers({
      prisma: {
        gameRecord: { findMany: async () => [] },
        user: {
          update: async ({ data }) => {
            updatedUsers.push(data);
            return { id: "user-1", selectedCharacter: data.selectedCharacter };
          }
        }
      },
      findRoomForUser: () => null,
      roomView: () => ({}),
      characterSelectionData: async () => ({
        characters: { sigrika: { id: "sigrika" } },
        disabledSlugs: new Set()
      }),
      publicUserFn: (user) => ({
        id: user.id,
        ownedCharacters: ["sigrika"],
        ownedDecorations: [],
        itemEffects: []
      }),
      blockedCharactersForEffects: () => new Set(["sigrika"])
    });
    const res = createResponse();

    await handlers.updateCharacter({
      user: { id: "user-1" },
      body: { characterId: "sigrika" }
    }, res);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: "\u7cd6\u679c\u6548\u679c\u4e2d\uff0c\u6682\u65f6\u65e0\u6cd5\u51fa\u6218" });
    expect(updatedUsers).toEqual([]);
  });
});
