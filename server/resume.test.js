import { describe, expect, it } from "vitest";
import { COLORS, GAME_PHASES } from "../src/shared/game.js";
import { resumePayloadForUser } from "./resume.js";

describe("resumePayloadForUser", () => {
  it("returns an unfinished in-memory room before reading records", async () => {
    const room = { code: "12345", game: { phase: GAME_PHASES.playing } };
    const payload = await resumePayloadForUser({
      prisma: { gameRecord: { findFirst: async () => { throw new Error("should not query records"); } } },
      userId: "user-1",
      roomCode: "12345",
      findRoomForUser: () => room,
      roomView: () => ({ code: room.code, game: room.game })
    });

    expect(payload).toEqual({
      type: "room",
      room: { code: "12345", game: { phase: GAME_PHASES.playing } }
    });
  });

  it("returns a finished record snapshot for the requested room after cleanup", async () => {
    const snapshot = {
      code: "12345",
      players: [{ user: { id: "user-1" }, color: COLORS.black }],
      game: {
        phase: GAME_PHASES.finished,
        winner: { winnerColor: COLORS.black, reason: "resign", text: "黑中盘胜" }
      }
    };
    const payload = await resumePayloadForUser({
      prisma: {
        gameRecord: {
          findFirst: async ({ where }) => {
            expect(where.roomCode).toBe("12345");
            expect(where.OR).toEqual([{ blackUserId: "user-1" }, { whiteUserId: "user-1" }]);
            return {
              id: "record-1",
              roomCode: "12345",
              resultText: "黑中盘胜",
              winnerColor: COLORS.black,
              resultReason: "resign",
              snapshot: JSON.stringify(snapshot),
              createdAt: new Date("2026-05-26T12:00:00Z")
            };
          }
        }
      },
      userId: "user-1",
      roomCode: "12345",
      findRoomForUser: () => null,
      roomView: () => null
    });

    expect(payload).toEqual({
      type: "result",
      recordId: "record-1",
      room: snapshot
    });
  });

  it("ignores corrupt persisted record snapshots instead of crashing resume", async () => {
    const payload = await resumePayloadForUser({
      prisma: {
        gameRecord: {
          findFirst: async () => ({
            id: "record-1",
            roomCode: "12345",
            snapshot: "{not-json"
          })
        }
      },
      userId: "user-1",
      roomCode: "12345",
      findRoomForUser: () => null,
      roomView: () => null
    });

    expect(payload).toEqual({ type: "none" });
  });
});
