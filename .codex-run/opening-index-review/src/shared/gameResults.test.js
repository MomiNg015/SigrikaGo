import { describe, expect, it } from "vitest";
import {
  MAX_INVALID_GAME_END_MOVE_NUMBER,
  createDrawResult,
  createResignResult,
  createTimeoutResult,
  isInvalidGameEnd,
  resultWithInvalidFlagForGame
} from "./gameResults.js";

describe("game results", () => {
  it("marks games through move 10 as invalid", () => {
    expect(MAX_INVALID_GAME_END_MOVE_NUMBER).toBe(10);
    expect(isInvalidGameEnd({ moveNumber: 10 })).toBe(true);
    expect(isInvalidGameEnd({ moveNumber: 11 })).toBe(false);
  });

  it("creates structured resign timeout and draw results", () => {
    expect(createResignResult("black")).toEqual({
      winnerColor: "white",
      reason: "resign",
      text: "白中盘胜"
    });
    expect(createTimeoutResult("white")).toEqual({
      winnerColor: "black",
      reason: "timeout",
      text: "黑超时胜"
    });
    expect(createDrawResult("agreement")).toEqual({
      winnerColor: null,
      reason: "agreement",
      text: "和棋"
    });
  });

  it("adds an invalid flag to early results without mutating valid results", () => {
    const result = createTimeoutResult("white");

    expect(resultWithInvalidFlagForGame({ moveNumber: 3 }, result)).toEqual({
      ...result,
      invalid: true
    });
    expect(resultWithInvalidFlagForGame({ moveNumber: 11 }, result)).toBe(result);
  });
});
