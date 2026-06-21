import { describe, expect, test } from "vitest";
import {
  SKILL_EFFECT_REDUCED_MOTION_MS,
  SKILL_PREVIEW_DELAY_MS,
  SKILL_BANNER_DURATION_MS,
  skillEffectPresentation,
  skillEffectTimeline,
  skillEffectTiming,
  skillPreviewResolutionDelay
} from "./skillPresentation.js";

describe("skillPresentation", () => {
  test("keeps existing default and reduced-motion timings", () => {
    expect(skillEffectTiming()).toEqual({
      startDelayMs: 2000,
      durationMs: 1800
    });
    expect(skillEffectTiming({ reducedMotion: true })).toEqual({
      startDelayMs: 2000,
      durationMs: SKILL_EFFECT_REDUCED_MOTION_MS
    });
  });

  test("resolves pending skill timeline metadata through the shared layer", () => {
    expect(skillEffectTimeline({
      bannerDurationMs: 1200,
      boardEffectDurationMs: 900
    })).toEqual({
      startDelayMs: 1200,
      durationMs: 900
    });
  });

  test("keeps resolution timing configurable by the effects switch", () => {
    expect(skillPreviewResolutionDelay()).toBe(SKILL_PREVIEW_DELAY_MS);
    expect(skillPreviewResolutionDelay({ effectsEnabled: false })).toBe(SKILL_BANNER_DURATION_MS);
  });

  test("resolves Nabomo passive immediately after the skill banner", () => {
    expect(skillPreviewResolutionDelay({ effectType: "color-illusion-passive" })).toBe(
      SKILL_BANNER_DURATION_MS
    );
  });

  test("normalizes catalog-backed Pixi board effects", () => {
    expect(skillEffectPresentation("erase-point")).toMatchObject({
      effectType: "erase-point",
      enabled: true,
      layers: {
        banner: true,
        boardEffect: true,
        domBoardEffect: false,
        sound: true
      }
    });
  });

  test("keeps DOM-only effects out of the Pixi board layer", () => {
    expect(skillEffectPresentation("row-slash")).toMatchObject({
      effectType: "row-slash",
      enabled: true,
      layers: {
        boardEffect: false,
        domBoardEffect: true,
        sound: true
      }
    });
  });

  test("combines ChangLi double-move Pixi cast with persistent DOM point flames", () => {
    expect(skillEffectPresentation("double-move")).toMatchObject({
      effectType: "double-move",
      enabled: true,
      layers: {
        boardEffect: true,
        domBoardEffect: true,
        sound: true
      }
    });
  });

  test("combines Mornye protocol takeover Pixi cast with persistent DOM point mark", () => {
    expect(skillEffectPresentation("protocol-takeover")).toMatchObject({
      effectType: "protocol-takeover",
      enabled: true,
      layers: {
        boardEffect: true,
        domBoardEffect: true,
        sound: true
      }
    });
  });

  test("combines Lynae spray-stone Pixi cast with persistent DOM spray stone visuals", () => {
    expect(skillEffectPresentation("spray-stone")).toMatchObject({
      effectType: "spray-stone",
      enabled: true,
      layers: {
        boardEffect: true,
        domBoardEffect: true,
        sound: true
      }
    });
  });

  test("disables all presentation layers for the future global effects switch", () => {
    expect(skillEffectPresentation("erase-point", { effectsEnabled: false })).toEqual({
      effectType: "erase-point",
      enabled: false,
      timeline: {
        startDelayMs: 0,
        durationMs: 0
      },
      layers: {
        banner: false,
        boardEffect: false,
        domBoardEffect: false,
        sound: false,
        characterCutIn: false,
        boardDim: false
      }
    });
  });
});
