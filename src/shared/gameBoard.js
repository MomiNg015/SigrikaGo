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

export function isStarPoint(x, y, size = BOARD_SIZE) {
  const stars = starPointCoordinates(size);
  return stars.some(([starX, starY]) => x === starX && y === starY);
}

export function starPointCoordinates(size = BOARD_SIZE) {
  if (size === 19) return starGrid([3, 9, 15]);
  if (size === 13) return [[3, 3], [9, 3], [6, 6], [3, 9], [9, 9]];
  const low = size >= 13 ? 3 : 2;
  const high = size - 1 - low;
  const center = Math.floor(size / 2);
  if (low >= high) return [[center, center]];
  return [[low, low], [high, low], [center, center], [low, high], [high, high]];
}

function starGrid(values) {
  return values.flatMap((y) => values.map((x) => [x, y]));
}
