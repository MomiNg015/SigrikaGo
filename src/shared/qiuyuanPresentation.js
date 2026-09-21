export const QIUYUAN_SLASH_START = 0.24;
export const QIUYUAN_SLASH_DURATION = 0.16;
// Hold the completed broad slash for a beat before it contracts into the scar.
export const QIUYUAN_SCAR_START = 0.5;
export const QIUYUAN_SCAR_SETTLE = 0.2;

const clamp = (value) => Math.min(1, Math.max(0, value));

export function qiuyuanSlashTravel(progress) {
  return 1 - (1 - clamp((progress - QIUYUAN_SLASH_START) / QIUYUAN_SLASH_DURATION)) ** 3;
}

// Inverse of the blade's cubic travel, including its off-board lead-in/out.
export function qiuyuanContactProgress(column, boardSize) {
  const distance = clamp((column + 1.25) / (boardSize + 1.5));
  return QIUYUAN_SLASH_START + QIUYUAN_SLASH_DURATION * (1 - Math.cbrt(1 - distance));
}

export function qiuyuanCutPointIds(pendingSkill) {
  return [...new Set((pendingSkill?.removedStones ?? []).map((stone) => stone.id))];
}
