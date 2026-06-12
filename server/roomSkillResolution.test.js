import { describe, expect, test } from "vitest";
import {
  SKILL_BOARD_EFFECT_DURATION_MS,
  SKILL_BANNER_DURATION_MS,
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

  test("keeps the preview window long enough for the banner and board effect", () => {
    expect(SKILL_BANNER_DURATION_MS).toBe(2000);
    expect(SKILL_BOARD_EFFECT_DURATION_MS).toBe(1800);
    expect(SKILL_PREVIEW_DELAY_MS).toBeGreaterThanOrEqual(
      SKILL_BANNER_DURATION_MS + SKILL_BOARD_EFFECT_DURATION_MS
    );
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
