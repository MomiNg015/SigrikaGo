import { describe, expect, it } from "vitest";
import { applyRankProgression as play, rankStarLimit, rankMatchStatus, compareRankProgress } from "./rankProgression.js";

describe("star ladder", () => {
  it.each([["18级", 4], ["1级", 4], ["1段", 4], ["3段", 4], ["4段", 6], ["6段", 6], ["7段", 8], ["8段", 8], ["9段", 0]])("caps %s at %i", (rank, limit) => {
    expect(rankStarLimit(rank)).toBe(limit);
  });
  it("requires another win after filling the last star", () => {
    const full = play({ rank: "3段", stars: 3, outcome: "win" });
    expect(full).toMatchObject({ rank: "3段", stars: 4, triggered: false, rating: 0 });
    expect(rankMatchStatus(full)).toBe("promotion");
    expect(play({ ...full, outcome: "loss" })).toMatchObject({ rank: "3段", stars: 3 });
    expect(play({ ...full, outcome: "win" })).toMatchObject({ rank: "4段", stars: 3, direction: "up" });
  });
  it("requires another loss after reaching zero", () => {
    const zero = play({ rank: "4段", stars: 1, outcome: "loss" });
    expect(zero).toMatchObject({ rank: "4段", stars: 0, triggered: false });
    expect(play({ ...zero, outcome: "win" })).toMatchObject({ rank: "4段", stars: 1 });
    expect(play({ ...zero, outcome: "loss" })).toMatchObject({ rank: "3段", stars: 2, direction: "down" });
  });
  it.each([["1级", 4, "win", "1段", 2], ["1段", 0, "loss", "1级", 2], ["6段", 6, "win", "7段", 4], ["7段", 0, "loss", "6段", 3], ["18级", 0, "loss", "18级", 0]])("crosses %s boundaries", (rank, stars, outcome, target, count) => {
    expect(play({ rank, stars, outcome })).toMatchObject({ rank: target, stars: count });
  });
  it("does not use recent-ten wins to promote", () => {
    expect(play({ rank: "3段", stars: 2, recentResults: Array(6).fill("win"), outcome: "win" })).toMatchObject({ rank: "3段", stars: 3, triggered: false });
  });
  it("starts every ninth-dan entry at 1000 and demotes to four stars", () => {
    expect(play({ rank: "8段", stars: 8, outcome: "win" })).toMatchObject({ rank: "9段", stars: 0, rating: 1000 });
    const down = play({ rank: "9段", rating: 0, outcome: "loss" });
    expect(down).toMatchObject({ rank: "8段", stars: 4, rating: 0 });
    let next = down;
    for (let i = 0; i < 5; i++) next = play({ ...next, outcome: "win" });
    expect(next).toMatchObject({ rank: "9段", rating: 1000, stars: 0 });
  });
  it("clamps points at zero without demoting that game", () => {
    expect(play({ rank: "9段", rating: 100, outcome: "loss" })).toMatchObject({ rank: "9段", rating: 0, triggered: false });
    expect(play({ rank: "9段", rating: 0, outcome: "win" })).toMatchObject({ rank: "9段", rating: 200 });
    expect(play({ rank: "9段", rating: 1000, outcome: "loss" })).toMatchObject({ rating: 750 });
  });
  it.each([{ rank: "3段", stars: 4 }, { rank: "4段", stars: 0 }, { rank: "9段", rating: 0 }])("draw preserves boundary %j", (state) => {
    expect(play({ ...state, outcome: "draw" })).toMatchObject({ ...state, triggered: false });
  });
  it("orders ranks before stars/points, including kyu", () => {
    const rows = [{ rank: "8段", stars: 8 }, { rank: "9段", rating: 0 }, { rank: "3段", stars: 0 }, { rank: "3段", stars: 4 }, { rank: "18级", stars: 4 }, { rank: "1级", stars: 0 }];
    expect(rows.sort(compareRankProgress).map((row) => [row.rank, row.stars ?? row.rating])).toEqual([["9段", 0], ["8段", 8], ["3段", 4], ["3段", 0], ["1级", 0], ["18级", 4]]);
  });
});
