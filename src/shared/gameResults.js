import { COLORS, opponent } from "./gameConstants.js";

export const INVALID_EARLY_RESIGN_NOTICE = "对局不超过10手结束，对局无效";
export const MAX_INVALID_GAME_END_MOVE_NUMBER = 10;
export const MIN_VALID_RESIGN_MOVE_NUMBER = 11;

export function isInvalidGameEnd(state) {
  return Number(state?.moveNumber ?? 0) <= MAX_INVALID_GAME_END_MOVE_NUMBER;
}

export function resultWithInvalidFlagForGame(state, result) {
  if (!result || !isInvalidGameEnd(state)) return result;
  return { ...result, invalid: true };
}

export function createResignResult(resigningColor, options = {}) {
  const winnerColor = opponent(resigningColor);
  return {
    winnerColor,
    reason: "resign",
    text: `${colorName(winnerColor)}中盘胜`,
    ...(options.invalid ? { invalid: true } : {})
  };
}

export function createTimeoutResult(timeoutColor) {
  const winnerColor = opponent(timeoutColor);
  return {
    winnerColor,
    reason: "timeout",
    text: `${colorName(winnerColor)}超时胜`
  };
}

export function createDrawResult(reason = "agreement") {
  return {
    winnerColor: null,
    reason,
    text: "和棋"
  };
}

function colorName(color) {
  return color === COLORS.black ? "黑" : "白";
}
