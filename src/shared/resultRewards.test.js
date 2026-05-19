import { describe, expect, it } from "vitest";
import { COLORS } from "./game.js";
import {
  COIN_DRAW_DELTA,
  COIN_LOSS_DELTA,
  COIN_WIN_DELTA,
  resultRewardDelta
} from "./resultRewards.js";

describe("result rewards", () => {
  it("awards win, loss, and draw rating and coin deltas", () => {
    expect(resultRewardDelta(COLORS.black, COLORS.black)).toEqual({
      outcome: "win",
      rating: 20,
      coins: COIN_WIN_DELTA
    });
    expect(resultRewardDelta(COLORS.white, COLORS.black)).toEqual({
      outcome: "loss",
      rating: -20,
      coins: COIN_LOSS_DELTA
    });
    expect(resultRewardDelta(COLORS.black, null)).toEqual({
      outcome: "draw",
      rating: 0,
      coins: COIN_DRAW_DELTA
    });
  });

  it("treats missing or invalid player color as a draw-like no-op", () => {
    expect(resultRewardDelta(null, COLORS.black)).toEqual({
      outcome: "draw",
      rating: 0,
      coins: COIN_DRAW_DELTA
    });
    expect(resultRewardDelta("observer", COLORS.white)).toEqual({
      outcome: "draw",
      rating: 0,
      coins: COIN_DRAW_DELTA
    });
  });
});
