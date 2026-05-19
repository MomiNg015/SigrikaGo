import { describe, expect, it } from "vitest";
import { rankFromRating } from "./ratingRank.js";

describe("rating rank", () => {
  it.each([
    [1800, "9段"],
    [1799, "9段"],
    [1700, "9段"],
    [1699, "8段"],
    [1200, "4段"],
    [1100, "3段"],
    [1000, "2段"],
    [900, "1段"],
    [899, "1级"],
    [800, "1级"],
    [799, "2级"],
    [700, "2级"],
    [0, "9级"],
    [-1, "10级"],
    [-200, "10级"]
  ])("maps rating %i to %s", (rating, rank) => {
    expect(rankFromRating(rating)).toBe(rank);
  });
});
