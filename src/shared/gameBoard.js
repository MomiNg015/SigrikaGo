export const BOARD_SIZE = 13;

export function createPoints(size = BOARD_SIZE) {
  const points = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      points.push({
        id: pointId(x, y),
        x,
        y,
        valid: true,
        stone: null,
        mark: null,
        neighbors: baseNeighbors(x, y, size)
      });
    }
  }
  return points;
}

export function pointId(x, y) {
  return `${x},${y}`;
}

export function parsePointId(id) {
  const [x, y] = id.split(",").map(Number);
  return { x, y };
}

function baseNeighbors(x, y, size) {
  return [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1]
  ]
    .filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < size && ny < size)
    .map(([nx, ny]) => pointId(nx, ny));
}

export function getPoint(state, id) {
  if (typeof id !== "string") return state.points.find((p) => p.id === id);
  const { x, y } = parsePointId(id);
  const size = state.size ?? BOARD_SIZE;
  if (Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < size && y < size) {
    const point = state.points[y * size + x];
    if (point?.id === id) return point;
  }
  return state.points.find((p) => p.id === id);
}

export function activeNeighbors(state, point) {
  return point.neighbors
    .map((id) => getPoint(state, id))
    .filter((neighbor) => neighbor?.valid);
}
