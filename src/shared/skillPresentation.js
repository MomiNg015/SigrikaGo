export const SKILL_BANNER_DURATION_MS = 2000;
export const SKILL_BOARD_EFFECT_DURATION_MS = 1800;
export const SKILL_PREVIEW_DELAY_MS = 4000;
export const SKILL_EFFECT_REDUCED_MOTION_MS = 320;

export function skillEffectTiming({ reducedMotion = false } = {}) {
  return {
    startDelayMs: SKILL_BANNER_DURATION_MS,
    durationMs: reducedMotion ? SKILL_EFFECT_REDUCED_MOTION_MS : SKILL_BOARD_EFFECT_DURATION_MS
  };
}
