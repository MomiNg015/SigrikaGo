import { expect, it } from "vitest";
import { calculateRatingDelta, normalizeRatingRules, privateCoinsForOutcome } from "./ratingRules.js";

it("removes legacy Elo and repeat-opponent multipliers", () => {
  expect(normalizeRatingRules({ elo: { kFactor: 80 }, antiBoost: { enabled: true } })).toEqual({
    privateRewards: { winCoins: 20, lossCoins: 10, drawCoins: 10, dailyRewardLimit: 3 }
  });
  expect(calculateRatingDelta({ self: { rank: "3段", stars: 2 }, outcome: "win" })).toBe(0);
  expect(calculateRatingDelta({ self: { rank: "9段", rating: 1000 }, outcome: "win", antiBoostMultiplier: 0 })).toBe(200);
  expect(calculateRatingDelta({ self: { rank: "9段", rating: 100 }, outcome: "loss" })).toBe(-100);
  expect(calculateRatingDelta({ self: { rank: "9段", rating: 500 }, outcome: "draw" })).toBe(0);
});
it("preserves private coin limits", () => {
  expect(privateCoinsForOutcome("win")).toBe(20);
  expect(normalizeRatingRules({ privateRewards: { dailyRewardLimit: 999 } }).privateRewards.dailyRewardLimit).toBe(20);
});
