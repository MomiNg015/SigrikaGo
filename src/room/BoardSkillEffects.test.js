import { describe, expect, test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BoardSkillEffects, {
  SKILL_EFFECT_REDUCED_MOTION_MS,
  boardPointCenter,
  effectTimingForPendingSkill,
  reducedMotionQuery
} from "./BoardSkillEffects.jsx";

describe("BoardSkillEffects", () => {
  test("maps board point ids to pixel centers for different board sizes", () => {
    expect(boardPointCenter("0,0", { boardSize: 13, width: 260, height: 260 })).toEqual({ x: 10, y: 10 });
    expect(boardPointCenter("12,12", { boardSize: 13, width: 260, height: 260 })).toEqual({ x: 250, y: 250 });
    expect(boardPointCenter("18,18", { boardSize: 19, width: 380, height: 380 })).toEqual({ x: 370, y: 370 });
  });

  test("starts board effects only after the skill banner phase", () => {
    expect(effectTimingForPendingSkill({
      effectType: "erase-point",
      bannerDurationMs: 2000,
      boardEffectDurationMs: 1800
    })).toEqual({
      startDelayMs: 2000,
      durationMs: 1800
    });
  });

  test("uses a short static reduced-motion timing", () => {
    expect(reducedMotionQuery).toBe("(prefers-reduced-motion: reduce)");
    expect(effectTimingForPendingSkill({
      effectType: "random-blast",
      bannerDurationMs: 2000,
      boardEffectDurationMs: 1800
    }, { reducedMotion: true })).toEqual({
      startDelayMs: 2000,
      durationMs: SKILL_EFFECT_REDUCED_MOTION_MS
    });
  });

  test("passes audio settings as presentation-only data", () => {
    const markup = renderToStaticMarkup(createElement(BoardSkillEffects, {
      boardSize: 13,
      audioSettings: { master: 50, sfx: 40 },
      pendingSkill: {
        id: "skill-audio",
        effectType: "random-blast",
        targetId: "6,6"
      }
    }));

    expect(markup).toContain('data-effect-id="skill-audio"');
    expect(markup).not.toContain("master");
    expect(markup).not.toContain("sfx");
  });

  test("renders a passive non-interactive overlay keyed by pending skill id", () => {
    const markup = renderToStaticMarkup(createElement(BoardSkillEffects, {
      boardSize: 13,
      pendingSkill: {
        id: "skill-1",
        effectType: "flip-stone",
        targetId: "4,4",
        affectedPointIds: ["4,4"]
      }
    }));

    expect(markup).toContain("board-effects-layer");
    expect(markup).toContain('data-effect-id="skill-1"');
    expect(markup).toContain('data-effect-type="flip-stone"');
    expect(markup).toContain("aria-hidden=\"true\"");
  });

  test("supports disabling idle Pixi prewarm for no-skill boards", () => {
    const markup = renderToStaticMarkup(createElement(BoardSkillEffects, {
      boardSize: 19,
      prewarm: false,
      pendingSkill: null
    }));

    expect(markup).toContain("board-effects-layer");
    expect(markup).not.toContain("prewarm");
  });
});
