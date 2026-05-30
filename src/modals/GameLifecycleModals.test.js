import { describe, expect, it } from "vitest";
import { colorTextForPlayer, formatSignedDelta, resultRewardForRoom, resultVoiceEventForRoom, secondsSinceStarted, secondsUntilTimestamp } from "./GameLifecycleModals.jsx";
import { COLORS } from "../shared/game.js";

describe("GameLifecycleModals helpers", () => {
  it("formats the player opening color", () => {
    expect(colorTextForPlayer({ color: COLORS.black })).toBe("黑");
    expect(colorTextForPlayer({ color: COLORS.white })).toBe("白");
    expect(colorTextForPlayer(null)).toBe("");
  });

  it("clamps lifecycle countdown values", () => {
    expect(secondsSinceStarted(1_000, 3_900)).toBe(2);
    expect(secondsUntilTimestamp(4_100, 1_000)).toBe(4);
    expect(secondsUntilTimestamp(900, 1_000)).toBe(0);
  });

  it("formats signed reward deltas", () => {
    expect(formatSignedDelta(20)).toBe("+20");
    expect(formatSignedDelta(0)).toBe("0");
    expect(formatSignedDelta(-20)).toBe("-20");
  });

  it("shows zero reward deltas for invalid early resign results", () => {
    const room = {
      players: [{ user: { id: "u1" }, color: COLORS.black }],
      game: {
        winner: {
          winnerColor: COLORS.black,
          invalid: true
        }
      }
    };

    expect(resultRewardForRoom(room, { id: "u1" })).toEqual({ rating: 0, coins: 0 });
  });

  it("selects the result voice event from the current player's outcome", () => {
    const room = {
      players: [
        { user: { id: "u1" }, color: COLORS.black },
        { user: { id: "u2" }, color: COLORS.white }
      ],
      game: {
        winner: {
          winnerColor: COLORS.black
        }
      }
    };

    expect(resultVoiceEventForRoom(room, { id: "u1" })).toBe("result-victory");
    expect(resultVoiceEventForRoom(room, { id: "u2" })).toBe("result-defeat");
  });

  it("selects draw result voice events but skips invalid early resigns", () => {
    const room = {
      players: [{ user: { id: "u1" }, color: COLORS.black }],
      game: { winner: null }
    };

    expect(resultVoiceEventForRoom(room, { id: "u1" })).toBe("result-draw");
    expect(resultVoiceEventForRoom({
      ...room,
      game: { winner: { winnerColor: COLORS.black, invalid: true } }
    }, { id: "u1" })).toBeNull();
  });
});
