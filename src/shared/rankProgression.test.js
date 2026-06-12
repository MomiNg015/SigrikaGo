import { describe, expect, it } from "vitest";
import {
  applyRankProgression,
  demoteRank,
  parseRecentResults,
  promoteRank,
  serializeRecentResults
} from "./rankProgression.js";

describe("rank progression", () => {
  it("promotes after seven wins in the current window and resets results", () => {
    expect(applyRankProgression({
      rank: "3段",
      recentResults: ["win", "loss", "win", "win", "win", "loss", "win", "win"],
      outcome: "win"
    })).toMatchObject({
      rank: "4段",
      recentResults: [],
      triggered: true,
      direction: "up"
    });
  });

  it("demotes after eight losses in the current window and resets results", () => {
    expect(applyRankProgression({
      rank: "1段",
      recentResults: ["loss", "win", "loss", "loss", "loss", "loss", "win", "loss", "loss"],
      outcome: "loss"
    })).toMatchObject({
      rank: "1级",
      recentResults: [],
      triggered: true,
      direction: "down"
    });
  });

  it("ignores draws and clamps rank boundaries", () => {
    expect(applyRankProgression({ rank: "9段", recentResults: ["win"], outcome: "draw" })).toMatchObject({
      rank: "9段",
      recentResults: ["win"],
      triggered: false
    });
    expect(promoteRank("9段")).toBe("9段");
    expect(demoteRank("18级")).toBe("18级");
  });

  it("serializes result windows from old to new", () => {
    const serialized = serializeRecentResults(["win", "loss", "draw", "胜", "负"]);
    expect(serialized).toBe("win,loss,win,loss");
    expect(parseRecentResults(serialized)).toEqual(["win", "loss", "win", "loss"]);
  });
});
