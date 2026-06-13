export function boardPointCenter(pointId, { boardSize = 13, width = 0, height = 0 } = {}) {
  const [rawX, rawY] = String(pointId ?? "").split(",").map(Number);
  const x = Number.isFinite(rawX) ? rawX : 0;
  const y = Number.isFinite(rawY) ? rawY : 0;
  return {
    x: ((x + 0.5) / boardSize) * width,
    y: ((y + 0.5) / boardSize) * height
  };
}

export function pointCenterForHost(pointId, { boardSize, host }) {
  if (!pointId) return null;
  return boardPointCenter(pointId, {
    boardSize,
    width: host.clientWidth,
    height: host.clientHeight
  });
}
