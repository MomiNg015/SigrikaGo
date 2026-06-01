import { describe, expect, it } from "vitest";
import { buildStatChangeToast, buildStatChangeToasts } from "./statChangeToast.js";

describe("buildStatChangeToasts", () => {
  it("returns no toast when tracked user stats do not change", () => {
    expect(buildStatChangeToasts(
      { coins: 20, rating: 1020, rank: "\u0032\u6bb5" },
      { coins: 20, rating: 1020, rank: "\u0032\u6bb5" }
    )).toEqual([]);
  });

  it("formats coins, rating, and rank changes as separate reward toasts", () => {
    expect(buildStatChangeToasts(
      { coins: 20, rating: 1020, rank: "\u0032\u6bb5" },
      { coins: 50, rating: 1045, rank: "\u0033\u6bb5" }
    )).toEqual([
      { tone: "reward", text: "\u91d1\u5e01+30" },
      { tone: "reward", text: "\u79ef\u5206+25" },
      { tone: "reward", text: "\u6bb5\u4f4d2\u6bb5 \u2192 3\u6bb5" }
    ]);
  });

  it("formats negative numeric changes and rank drops as penalty toasts", () => {
    expect(buildStatChangeToasts(
      { coins: 50, rating: 1045, rank: "\u0033\u6bb5" },
      { coins: 40, rating: 1020, rank: "\u0032\u6bb5" }
    )).toEqual([
      { tone: "penalty", text: "\u91d1\u5e01-10" },
      { tone: "penalty", text: "\u79ef\u5206-25" },
      { tone: "penalty", text: "\u6bb5\u4f4d3\u6bb5 \u2192 2\u6bb5" }
    ]);
  });

  it("uses penalty tone for an aggregated all-negative stat change toast", () => {
    expect(buildStatChangeToast(
      { id: "u1", coins: 50, rating: 1045, rank: "\u0033\u6bb5" },
      { id: "u1", coins: 40, rating: 1020, rank: "\u0032\u6bb5" }
    )).toEqual({
      tone: "penalty",
      text: "\u91d1\u5e01-10\uff1b\u79ef\u5206-25\uff1b\u6bb5\u4f4d3\u6bb5 \u2192 2\u6bb5"
    });
  });
});
