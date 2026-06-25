import { describe, expect, test } from "vitest";
import {
  HIDDEN_HAND_BOARD_EFFECT_DURATION_MS,
  HIDDEN_HAND_PREVIEW_DELAY_MS,
  SKILL_EFFECT_REDUCED_MOTION_MS,
  SKILL_PREVIEW_DELAY_MS,
  SKILL_BANNER_DURATION_MS,
  SKILL_BOARD_EFFECT_DURATION_MS,
  VOYAGE_STAR_PREVIEW_DELAY_MS,
  VOYAGE_STAR_WHITEOUT_RESOLUTION_PROGRESS,
  skillBoardEffectDurationMs,
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

  test("resolves Denia flip-stone while the corrupt bubble covers the target", () => {
    expect(skillPreviewResolutionDelay({ effectType: "flip-stone" })).toBe(3040);
  });

  test("keeps Aemeath hidden-hand within its upgraded board-effect window", () => {
    expect(HIDDEN_HAND_BOARD_EFFECT_DURATION_MS).toBe(1500);
    expect(HIDDEN_HAND_PREVIEW_DELAY_MS).toBe(3500);
    expect(skillBoardEffectDurationMs({ effectType: "hidden-hand" })).toBe(1500);
    expect(skillPreviewResolutionDelay({ effectType: "hidden-hand" })).toBe(3500);
  });

  test("resolves Voyage Star while the opaque whiteout is still covering the board", () => {
    expect(VOYAGE_STAR_WHITEOUT_RESOLUTION_PROGRESS).toBe(0.52);
    expect(VOYAGE_STAR_PREVIEW_DELAY_MS).toBe(
      SKILL_BANNER_DURATION_MS + Math.round(SKILL_BOARD_EFFECT_DURATION_MS * 0.52)
    );
    expect(skillPreviewResolutionDelay({ effectType: "voyage-star" })).toBe(VOYAGE_STAR_PREVIEW_DELAY_MS);
    expect(skillEffectPresentation("voyage-star")).toMatchObject({
      effectType: "voyage-star",
      enabled: true,
      layers: {
        boardEffect: true,
        domBoardEffect: true,
        sound: true
      }
    });
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

  test("combines QiuYuan row-slash Pixi cast with the DOM row scar layer", () => {
    expect(skillEffectPresentation("row-slash")).toMatchObject({
      effectType: "row-slash",
      enabled: true,
      layers: {
        boardEffect: true,
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

  test("combines Chisa liberty-purge Pixi cast with persistent DOM removal marks", () => {
    expect(skillPreviewResolutionDelay({ effectType: "liberty-purge" })).toBe(3800);
    expect(skillBoardEffectDurationMs({
      effectType: "liberty-purge",
      removalMarkIds: ["0,0", "1,1", "2,2", "3,3", "4,4", "5,5", "6,6", "7,7"]
    })).toBe(2530);
    expect(skillPreviewResolutionDelay({
      effectType: "liberty-purge",
      removalMarkIds: ["0,0", "1,1", "2,2", "3,3", "4,4", "5,5", "6,6", "7,7"]
    })).toBe(4530);
    expect(skillEffectPresentation("liberty-purge")).toMatchObject({
      effectType: "liberty-purge",
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
