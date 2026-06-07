import { describe, expect, test } from "vitest";
import {
  SKILL_PREVIEW_DELAY_MS,
  createPendingSkillResolution,
  pendingSkillResolutionDelay,
  canSchedulePendingSkillResolution
} from "./roomSkillResolution.js";

describe("room skill resolution helpers", () => {
  test("creates a serializable pending skill resolution snapshot", () => {
    const game = { phase: "playing", history: [{ type: "skill" }] };
    const resolution = createPendingSkillResolution({
      pendingSkillId: "skill-1",
      game,
      notices: ["notice"],
      playerColor: "black",
      now: () => 1000
    });

    expect(resolution).toEqual({
      pendingSkillId: "skill-1",
      resolvesAt: 1000 + SKILL_PREVIEW_DELAY_MS,
      game,
      notices: ["notice"],
      playerColor: "black"
    });
    expect(JSON.parse(JSON.stringify(resolution))).toEqual(resolution);
  });

  test("calculates remaining delay for restored pending skill snapshots", () => {
    expect(pendingSkillResolutionDelay({ resolvesAt: 2500 }, { now: () => 1000 })).toBe(1500);
    expect(pendingSkillResolutionDelay({ resolvesAt: 500 }, { now: () => 1000 })).toBe(0);
  });

  test("requires both a pending skill id and a resolved game snapshot before scheduling", () => {
    expect(canSchedulePendingSkillResolution({ pendingSkillId: "skill-1", game: {} })).toBe(true);
    expect(canSchedulePendingSkillResolution({ pendingSkillId: "", game: {} })).toBe(false);
    expect(canSchedulePendingSkillResolution({ pendingSkillId: "skill-1", game: null })).toBe(false);
    expect(canSchedulePendingSkillResolution(null)).toBe(false);
  });
});
