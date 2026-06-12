export {
  SKILL_BANNER_DURATION_MS,
  SKILL_BOARD_EFFECT_DURATION_MS,
  SKILL_PREVIEW_DELAY_MS
} from "../src/shared/skillPresentation.js";

import { SKILL_PREVIEW_DELAY_MS } from "../src/shared/skillPresentation.js";

export function createPendingSkillResolution({
  pendingSkillId,
  game,
  notices = [],
  playerColor,
  now = Date.now
}) {
  return {
    pendingSkillId,
    resolvesAt: now() + SKILL_PREVIEW_DELAY_MS,
    game,
    notices,
    playerColor
  };
}

export function canSchedulePendingSkillResolution(resolution) {
  return Boolean(resolution?.pendingSkillId && resolution.game);
}

export function pendingSkillResolutionDelay(resolution, { now = Date.now } = {}) {
  return Math.max(0, (resolution?.resolvesAt ?? now()) - now());
}
