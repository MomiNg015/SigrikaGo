import { describe, expect, it } from "vitest";
import {
  decodeReplayCursor,
  listReplaySummaryPage,
  REPLAY_PAGE_SIZE
} from "./replayPagination.js";

describe("replay summary pagination", () => {
  it("returns fifty records and an opaque cursor for the next older page", async () => {
    let query = null;
    const rows = Array.from({ length: REPLAY_PAGE_SIZE + 1 }, (_, index) => replayRecord(index));
    const page = await listReplaySummaryPage({
      prisma: {
        gameRecord: {
          findMany: async (args) => {
            query = args;
            return rows;
          }
        }
      },
      userId: "user-1",
      mode: "spark"
    });

    expect(page.records).toHaveLength(50);
    expect(page.nextCursor).toEqual(expect.any(String));
    expect(decodeReplayCursor(page.nextCursor)).toEqual({
      createdAt: rows[49].createdAt,
      id: rows[49].id
    });
    expect(query.take).toBe(51);
    expect(query.orderBy).toEqual([{ createdAt: "desc" }, { id: "desc" }]);
    expect(query.where.AND[0].OR).toEqual([
      { blackUserId: "user-1" },
      { whiteUserId: "user-1" }
    ]);
    expect(query.select).toMatchObject({
      blackCostumeId: true,
      whiteCostumeId: true,
      blackCostumePortraitUrl: true,
      whiteCostumePortraitUrl: true,
      blackCostumePortraitScalePercent: true,
      blackCostumePortraitOffsetXPercent: true,
      blackCostumePortraitOffsetYPercent: true
    });
    expect(page.records[0].blackCostumePortraitUrl).toBe("/assets/costumes/sigrika-01.webp");
  });

  it("applies the composite createdAt/id cursor without skipping equal timestamps", async () => {
    let query = null;
    const cursorRecord = replayRecord(10);
    await listReplaySummaryPage({
      prisma: {
        gameRecord: {
          findMany: async (args) => {
            query = args;
            return [];
          }
        }
      },
      userId: "user-1",
      mode: "standard",
      cursor: Buffer.from(JSON.stringify({
        createdAt: cursorRecord.createdAt.toISOString(),
        id: cursorRecord.id
      })).toString("base64url")
    });

    expect(query.where.mode).toBe("standard");
    expect(query.where.AND[1].OR).toEqual([
      { createdAt: { lt: cursorRecord.createdAt } },
      { createdAt: cursorRecord.createdAt, id: { lt: cursorRecord.id } }
    ]);
  });

  it("rejects malformed cursors", async () => {
    await expect(listReplaySummaryPage({
      prisma: { gameRecord: { findMany: async () => [] } },
      userId: "user-1",
      cursor: "not-a-cursor"
    })).rejects.toMatchObject({ status: 400, message: "棋谱分页参数无效" });
  });
});

function replayRecord(index) {
  return {
    id: `record-${String(99 - index).padStart(3, "0")}`,
    roomCode: "ROOM01",
    blackUserId: "user-1",
    whiteUserId: "user-2",
    blackName: "black",
    whiteName: "white",
    resultText: "黑胜",
    winnerColor: "black",
    resultReason: "resign",
    rated: true,
    matchSource: "matchmaking",
    blackRatingDelta: 10,
    whiteRatingDelta: -10,
    blackCoinsDelta: 50,
    whiteCoinsDelta: 20,
    blackRankDelta: 0,
    whiteRankDelta: 0,
    moveCount: 20,
    mode: "spark",
    blackCharacter: "sigrika",
    whiteCharacter: "aemeath",
    blackCostumeId: "sigrika-costume-01",
    whiteCostumeId: "",
    blackCostumePortraitUrl: "/assets/costumes/sigrika-01.webp",
    whiteCostumePortraitUrl: "",
    blackCostumePortraitScalePercent: 83,
    whiteCostumePortraitScalePercent: 100,
    blackCostumePortraitOffsetXPercent: 0,
    whiteCostumePortraitOffsetXPercent: 0,
    blackCostumePortraitOffsetYPercent: 0,
    whiteCostumePortraitOffsetYPercent: 0,
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, 100 - index))
  };
}
