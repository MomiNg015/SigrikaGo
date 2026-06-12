import { describe, expect, it } from "vitest";
import { createReplayRouteHandlers } from "./replayRoutes.js";

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

describe("personal replay route", () => {
  it("does not limit records used by the player manual stats to the latest 30 games", async () => {
    let query = null;
    const handlers = createReplayRouteHandlers({
      prisma: {
        gameRecord: {
          findMany: async (args) => {
            query = args;
            return [];
          }
        }
      }
    });
    const res = createResponse();

    await handlers.listUserReplays({ user: { id: "user-1" } }, res);

    expect(query.take).toBeUndefined();
    expect(query.where.OR).toEqual([
      { blackUserId: "user-1" },
      { whiteUserId: "user-1" }
    ]);
  });

  it("returns player ids so manual stats do not depend on stored display names", async () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const handlers = createReplayRouteHandlers({
      prisma: {
        gameRecord: {
          findMany: async () => [{
            id: "record-1",
            roomCode: "ABCD12",
            blackUserId: "black-1",
            whiteUserId: "white-1",
            blackName: "Black",
            whiteName: "White",
            resultText: "\u9ed1\u65b9\u80dc",
            winnerColor: "black",
            resultReason: "resign",
            moveCount: 42,
            mode: null,
            blackCharacter: "sigrika",
            whiteCharacter: "denia",
            createdAt
          }]
        }
      }
    });
    const res = createResponse();

    await handlers.listUserReplays({ user: { id: "user-1" } }, res);

    expect(res.body.records[0]).toMatchObject({
      blackUserId: "black-1",
      whiteUserId: "white-1",
      mode: "spark"
    });
  });

  it("returns parsed replay snapshots", async () => {
    const handlers = createReplayRouteHandlers({
      prisma: {
        gameRecord: {
          findUnique: async ({ where }) => ({
            id: where.id,
            snapshot: "{\"moves\":[{\"x\":1,\"y\":2}]}"
          })
        }
      }
    });
    const res = createResponse();

    await handlers.getReplay({ params: { id: "record-1" } }, res);

    expect(res.body.record.snapshot).toEqual({ moves: [{ x: 1, y: 2 }] });
  });
});
