import { skillEffectHasBoardEffect } from "./skillEffectCatalog.js";

export const SKILL_BANNER_DURATION_MS = 2000;
export const SKILL_BOARD_EFFECT_DURATION_MS = 1800;
export const SKILL_PREVIEW_DELAY_MS = 4000;
export const FLIP_STONE_BUBBLE_COVER_RESOLUTION_MS = 3040;
export const HIDDEN_HAND_BOARD_EFFECT_DURATION_MS = 1500;
export const HIDDEN_HAND_PREVIEW_DELAY_MS = SKILL_BANNER_DURATION_MS + HIDDEN_HAND_BOARD_EFFECT_DURATION_MS;
export const SKILL_EFFECT_REDUCED_MOTION_MS = 320;
export const LIBERTY_PURGE_SLASH_INITIAL_DELAY_MS = 240;
export const LIBERTY_PURGE_SLASH_STAGGER_MS = 170;
export const LIBERTY_PURGE_SLASH_DRAW_MS = 650;
export const LIBERTY_PURGE_SLASH_EXIT_MS = 450;

const DEFAULT_SKILL_PRESENTATION_LAYERS = Object.freeze({
  banner: true,
  boardEffect: "catalog",
  domBoardEffect: false,
  sound: true,
  characterCutIn: false,
  boardDim: false
});

export const SKILL_EFFECT_PRESENTATION_CONFIG = Object.freeze({
  "flip-stone": Object.freeze({
    resolutionDelayMs: FLIP_STONE_BUBBLE_COVER_RESOLUTION_MS
  }),
  "hidden-hand": Object.freeze({
    resolutionDelayMs: HIDDEN_HAND_PREVIEW_DELAY_MS
  }),
  "row-slash": Object.freeze({
    layers: Object.freeze({
      domBoardEffect: true
    })
  }),
  "double-move": Object.freeze({
    layers: Object.freeze({
      domBoardEffect: true
    })
  }),
  "protocol-takeover": Object.freeze({
    layers: Object.freeze({
      domBoardEffect: true
    })
  }),
  "spray-stone": Object.freeze({
    layers: Object.freeze({
      domBoardEffect: true
    })
  }),
  "liberty-purge": Object.freeze({
    layers: Object.freeze({
      domBoardEffect: true
    })
  }),
  "color-illusion-passive": Object.freeze({
    resolutionDelayMs: SKILL_BANNER_DURATION_MS,
    layers: Object.freeze({
      boardEffect: false,
      domBoardEffect: false,
      sound: false
    })
  })
});

export function skillEffectTiming({ reducedMotion = false } = {}) {
  return {
    startDelayMs: SKILL_BANNER_DURATION_MS,
    durationMs: reducedMotion ? SKILL_EFFECT_REDUCED_MOTION_MS : SKILL_BOARD_EFFECT_DURATION_MS
  };
}

export function skillBoardEffectDurationMs({ effectType = "", removalMarkIds = [] } = {}) {
  if (effectType === "hidden-hand") return HIDDEN_HAND_BOARD_EFFECT_DURATION_MS;
  if (effectType !== "liberty-purge") return SKILL_BOARD_EFFECT_DURATION_MS;
  const removalCount = Array.isArray(removalMarkIds) ? removalMarkIds.length : 0;
  if (removalCount <= 1) return SKILL_BOARD_EFFECT_DURATION_MS;
  return Math.max(
    SKILL_BOARD_EFFECT_DURATION_MS,
    LIBERTY_PURGE_SLASH_INITIAL_DELAY_MS
      + (removalCount - 1) * LIBERTY_PURGE_SLASH_STAGGER_MS
      + LIBERTY_PURGE_SLASH_DRAW_MS
      + LIBERTY_PURGE_SLASH_EXIT_MS
  );
}

export function skillPreviewResolutionDelay({ effectType = "", effectsEnabled = true, removalMarkIds = [] } = {}) {
  if (effectsEnabled === false) return SKILL_BANNER_DURATION_MS;
  if (effectType === "liberty-purge") {
    return SKILL_BANNER_DURATION_MS + skillBoardEffectDurationMs({ effectType, removalMarkIds });
  }
  const configuredDelay = Number(SKILL_EFFECT_PRESENTATION_CONFIG[effectType]?.resolutionDelayMs);
  if (Number.isFinite(configuredDelay) && configuredDelay >= 0) return configuredDelay;
  return SKILL_PREVIEW_DELAY_MS;
}

export function skillEffectTimeline(pendingSkill = null, { reducedMotion = false, effectsEnabled = true } = {}) {
  if (effectsEnabled === false) {
    return {
      startDelayMs: 0,
      durationMs: 0
    };
  }

  const timing = skillEffectTiming({ reducedMotion });
  return {
    startDelayMs: Number(pendingSkill?.bannerDurationMs ?? timing.startDelayMs),
    durationMs: reducedMotion
      ? SKILL_EFFECT_REDUCED_MOTION_MS
      : Number(pendingSkill?.boardEffectDurationMs ?? timing.durationMs)
  };
}

export function skillEffectPresentation(effectType, {
  pendingSkill = null,
  reducedMotion = false,
  effectsEnabled = true
} = {}) {
  const hasEffectType = Boolean(effectType);
  const enabled = effectsEnabled !== false && hasEffectType;
  const override = SKILL_EFFECT_PRESENTATION_CONFIG[effectType] ?? {};
  const configuredLayers = {
    ...DEFAULT_SKILL_PRESENTATION_LAYERS,
    ...(override.layers ?? {})
  };
  const catalogBoardEffect = skillEffectHasBoardEffect(effectType);
  const boardEffect = enabled && (
    configuredLayers.boardEffect === "catalog"
      ? catalogBoardEffect
      : Boolean(configuredLayers.boardEffect)
  );

  return {
    effectType: effectType ?? "",
    enabled,
    timeline: skillEffectTimeline(pendingSkill, { reducedMotion, effectsEnabled: enabled }),
    layers: {
      banner: enabled && Boolean(configuredLayers.banner),
      boardEffect,
      domBoardEffect: enabled && Boolean(configuredLayers.domBoardEffect),
      sound: enabled && Boolean(configuredLayers.sound),
      characterCutIn: enabled && Boolean(configuredLayers.characterCutIn),
      boardDim: enabled && Boolean(configuredLayers.boardDim)
    }
  };
}
