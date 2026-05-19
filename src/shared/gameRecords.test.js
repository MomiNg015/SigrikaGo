import { describe, expect, it } from "vitest";
import { derivePlayerRecordStats, gameResultMetadata, recordWinnerColor } from "./gameRecords.js";

describe("shared game record helpers", () => {
  it("prefers structured winner colors over legacy result text", () => {
    expect(recordWinnerColor({ winnerColor: "white", resultText: "黑胜3.25子" })).toBe("white");
  });

  it("falls back to readable Chinese legacy result text when structured winner color is missing", () => {
    expect(recordWinnerColor({ resultText: "黑胜3.25子" })).toBe("black");
    expect(recordWinnerColor({ resultText: "白中盘胜" })).toBe("white");
    expect(recordWinnerColor({ resultText: "白方认输" })).toBe("black");
    expect(recordWinnerColor({ resultText: "黑方超时" })).toBe("white");
    expect(recordWinnerColor({ resultText: "和棋" })).toBeNull();
  });

  it("derives player stats from either user ids or display names", () => {
    const stats = derivePlayerRecordStats(
      { id: "user-1", username: "alice" },
      [
        { blackUserId: "user-1", whiteUserId: "user-2", winnerColor: "black" },
        { blackName: "bob", whiteName: "alice", winnerColor: "black" },
        { blackName: "alice", whiteName: "chris", resultText: "白中盘胜" },
        { blackName: "alice", whiteName: "dana", resultText: "和棋" }
      ]
    );

    expect(stats).toEqual({
      totalGames: 4,
      wins: 1,
      losses: 2,
      draws: 1,
      rating: 980
    });
  });

  it("keeps persisted user rating instead of recalculating it from visible records", () => {
    const stats = derivePlayerRecordStats(
      { id: "user-1", username: "alice", rating: 1260 },
      [
        { blackUserId: "user-1", whiteUserId: "user-2", winnerColor: "black" }
      ]
    );

    expect(stats).toMatchObject({
      totalGames: 1,
      wins: 1,
      rating: 1260
    });
  });

  it("does not count unrecognized legacy records as draws", () => {
    const stats = derivePlayerRecordStats(
      { id: "user-1", username: "alice" },
      [
        { blackUserId: "user-1", whiteUserId: "user-2", resultText: "白胜2.75子" },
        { blackUserId: "user-1", whiteUserId: "user-2", resultText: "result pending" },
        { blackUserId: "user-1", whiteUserId: "user-2", resultText: "和棋" }
      ]
    );

    expect(stats).toEqual({
      totalGames: 3,
      wins: 0,
      losses: 1,
      draws: 1,
      rating: 980
    });
  });

  it("serializes winner metadata for persisted records", () => {
    expect(gameResultMetadata({ winnerColor: "black", reason: "timeout" })).toEqual({
      winnerColor: "black",
      resultReason: "timeout"
    });
    expect(gameResultMetadata({ winnerColor: null, reason: "agreement" })).toEqual({
      winnerColor: null,
      resultReason: "agreement"
    });
  });
});
