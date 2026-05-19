import { COLORS } from "./game.js";
import { ratingDeltaForResult } from "./gameRecords.js";

export const COIN_WIN_DELTA = 50;
export const COIN_LOSS_DELTA = 20;
export const COIN_DRAW_DELTA = 0;

export function resultRewardDelta(playerColor, winnerColor) {
  const normalizedWinner = winnerColor === COLORS.black || winnerColor === COLORS.white ? winnerColor : null;
  const normalizedPlayer = playerColor === COLORS.black || playerColor === COLORS.white ? playerColor : null;
  if (!normalizedPlayer || !normalizedWinner) {
    return {
      outcome: "draw",
      rating: ratingDeltaForResult(normalizedPlayer, normalizedWinner),
      coins: COIN_DRAW_DELTA
    };
  }
  const won = normalizedPlayer === normalizedWinner;
  return {
    outcome: won ? "win" : "loss",
    rating: ratingDeltaForResult(normalizedPlayer, normalizedWinner),
    coins: won ? COIN_WIN_DELTA : COIN_LOSS_DELTA
  };
}
