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
  const domCenter = pointDomCenterForHost(pointId, host);
  if (domCenter) return domCenter;
  return boardPointCenter(pointId, {
    boardSize,
    width: host.clientWidth,
    height: host.clientHeight
  });
}

function pointDomCenterForHost(pointId, host) {
  const board = host?.parentElement;
  if (!board?.querySelector || !host?.getBoundingClientRect) return null;
  const point = board.querySelector(`[data-point-id="${escapeAttributeValue(pointId)}"]`);
  if (!point?.getBoundingClientRect) return null;
  const hostRect = host.getBoundingClientRect();
  const pointRect = point.getBoundingClientRect();
  return {
    x: pointRect.left - hostRect.left + pointRect.width / 2,
    y: pointRect.top - hostRect.top + pointRect.height / 2
  };
}

function escapeAttributeValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}
