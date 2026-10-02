import { activeNeighbors, getPoint } from "./gameBoard.js";

export function collectGroup(state, startId) {
  const start = getPoint(state, startId);
  if (!start?.valid || !start.stone) return { color: null, stones: [], liberties: new Set() };
  const stones = [];
  const liberties = new Set();
  const seen = new Set([startId]);
  const queue = [start];

  for (let index = 0; index < queue.length; index += 1) {
    const point = queue[index];
    stones.push(point.id);
    for (const neighbor of activeNeighbors(state, point)) {
      if (!neighbor.stone) {
        liberties.add(neighbor.id);
      } else if (neighbor.stone === start.stone && !seen.has(neighbor.id)) {
        seen.add(neighbor.id);
        queue.push(neighbor);
      }
    }
  }

  return { color: start.stone, stones, liberties };
}
