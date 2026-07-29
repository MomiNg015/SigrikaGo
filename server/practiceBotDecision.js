import {
  activeNeighbors,
  collectGroup,
  getPoint,
  opponent
} from "../src/shared/game.js";

// Spark scoring still needs a conservative rule-native dead-group helper because
// GNU Go cannot model skill-created invalid points or neutral stones.
export function obviousDeadBotGroups(game, botColor) {
  const dead = [];
  const visited = new Set();
  const rival = opponent(botColor);
  for (const point of game.points) {
    if (!point.valid || point.stone !== botColor || visited.has(point.id)) continue;
    const group = collectGroup(game, point.id);
    group.stones.forEach((id) => visited.add(id));
    if (group.liberties.size !== 1) continue;
    const [libertyId] = group.liberties;
    const liberty = getPoint(game, libertyId);
    const surrounded = activeNeighbors(game, liberty)
      .filter((neighborPoint) => !group.stones.includes(neighborPoint.id))
      .every((neighborPoint) => neighborPoint.stone === rival);
    if (surrounded) dead.push(point.id);
  }
  return dead;
}
