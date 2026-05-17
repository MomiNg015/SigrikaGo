import { describe, expect, it } from "vitest";
import { gameResultMetadata, recordWinnerColor } from "./gameRecords.js";

describe("game record helpers", () => {
  it("prefers structured winner colors over result text", () => {
    expect(recordWinnerColor({ winnerColor: "white", resultText: "黑胜3.25子" })).toBe("white");
  });

  it("falls back to result text for legacy records", () => {
    expect(recordWinnerColor({ resultText: "黑胜3.25子" })).toBe("black");
    expect(recordWinnerColor({ resultText: "白中盘胜" })).toBe("white");
    expect(recordWinnerColor({ resultText: "和棋" })).toBeNull();
  });

  it("serializes winner metadata for new records", () => {
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
