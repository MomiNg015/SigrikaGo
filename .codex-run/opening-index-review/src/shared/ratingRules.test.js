import { describe, expect, it } from "vitest";
import {
  DEFAULT_RATING_RULES,
  antiBoostMultiplierForRepeatCount,
  calculateRatingDelta,
  normalizeRatingRules,
  outcomeForPlayer,
  privateCoinsForOutcome
} from "./ratingRules.js";

describe("rating rules", () => {
  it("keeps equal-rating decisive games compatible with the old 20 point rhythm", () => {
    const self = { rating: 1000, rank: "3段" };
    const opponent = { rating: 1000, rank: "3段" };

    expect(calculateRatingDelta({ self, opponent, outcome: "win" })).toBe(20);
    expect(calculateRatingDelta({ self, opponent, outcome: "loss" })).toBe(-20);
  });

  it("lets equal-rating draws stay at zero while uneven draws can move rating", () => {
    expect(calculateRatingDelta({
      self: { rating: 1000, rank: "3段" },
      opponent: { rating: 1000, rank: "3段" },
      outcome: "draw"
    })).toBe(0);
    expect(calculateRatingDelta({
      self: { rating: 800, rank: "3段" },
      opponent: { rating: 1200, rank: "3段" },
      outcome: "draw"
    })).toBeGreaterThan(0);
  });

  it("reduces all rewards across large rank gaps but punishes high-rank upsets harder", () => {
    const low = { rating: 1000, rank: "3段" };
    const high = { rating: 1000, rank: "9段" };

    expect(calculateRatingDelta({ self: high, opponent: low, outcome: "win" })).toBe(5);
    expect(calculateRatingDelta({ self: low, opponent: high, outcome: "loss" })).toBe(-5);
    expect(calculateRatingDelta({ self: low, opponent: high, outcome: "win" })).toBe(5);
    expect(calculateRatingDelta({ self: high, opponent: low, outcome: "loss" })).toBe(-40);
  });

  it("applies optional anti-boost multipliers after rank-gap adjustment", () => {
    expect(calculateRatingDelta({
      self: { rating: 1000, rank: "3段" },
      opponent: { rating: 1000, rank: "3段" },
      outcome: "win",
      antiBoostMultiplier: 0.25
    })).toBe(5);
  });

  it("normalizes configurable anti-boost and private reward values", () => {
    const rules = normalizeRatingRules({
      ...DEFAULT_RATING_RULES,
      antiBoost: { enabled: true, fullScoreGames: 3, reducedScoreGames: 6, reducedMultiplier: 0.25 },
      privateRewards: { winCoins: 20, lossCoins: 10, drawCoins: 10, dailyRewardLimit: 3 }
    });

    expect(antiBoostMultiplierForRepeatCount(2, rules)).toBe(1);
    expect(antiBoostMultiplierForRepeatCount(3, rules)).toBe(0.25);
    expect(antiBoostMultiplierForRepeatCount(6, rules)).toBe(0);
    expect(privateCoinsForOutcome("win", rules)).toBe(20);
    expect(privateCoinsForOutcome("loss", rules)).toBe(10);
    expect(privateCoinsForOutcome("draw", rules)).toBe(10);
  });

  it("normalizes player outcomes from colors", () => {
    expect(outcomeForPlayer("black", "black")).toBe("win");
    expect(outcomeForPlayer("white", "black")).toBe("loss");
    expect(outcomeForPlayer("black", null)).toBe("draw");
  });
});
