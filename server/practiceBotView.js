import { gameViewForColor } from "../src/shared/game.js";

// Zhunshibao ignores visual color disguises, but still respects hidden hands.
export function practiceBotView(game, botColor) {
  return gameViewForColor({
    ...game,
    points: game.points.map((point) => ({ ...point, colorIllusion: null }))
  }, botColor);
}
