import { COLORS } from "./game.js";
import { calculateRatingDelta, outcomeForPlayer } from "./ratingRules.js";

export const COIN_WIN_DELTA = 50;
export const COIN_LOSS_DELTA = 20;
export const COIN_DRAW_DELTA = 0;

export function resultRewardDelta(playerColor, winnerColor, options = {}) {
  const normalizedWinner = winnerColor === COLORS.black || winnerColor === COLORS.white ? winnerColor : null;
  const normalizedPlayer = playerColor === COLORS.black || playerColor === COLORS.white ? playerColor : null;
  const outcome = outcomeForPlayer(normalizedPlayer, normalizedWinner);
  if (!normalizedPlayer) {
    return {
      outcome: "draw",
      rating: 0,
      coins: COIN_DRAW_DELTA
    };
  }
  if (!normalizedWinner) {
    return {
      outcome: "draw",
      rating: options.self
        ? calculateRatingDelta({ self: options.self, outcome })
        : 0,
      coins: COIN_DRAW_DELTA
    };
  }
  const won = normalizedPlayer === normalizedWinner;
  return {
    outcome: won ? "win" : "loss",
    rating: options.self
      ? calculateRatingDelta({ self: options.self, outcome })
      : 0,
    coins: won ? COIN_WIN_DELTA : COIN_LOSS_DELTA
  };
}
