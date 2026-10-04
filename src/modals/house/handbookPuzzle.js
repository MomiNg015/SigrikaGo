import geometry from './handbookPuzzleGeometry.json';
import { canonicalCharacterId } from '../../shared/characterAliases.js';

const PORTRAIT_ORDER = ['lynae', 'aemeath', 'mornye', 'nabomo', 'changli', 'sigrika', 'baconbits', 'qiuyuan', 'chisa', 'denia'];

export function orderHandbookCharacters(characters) {
  const order = new Map(PORTRAIT_ORDER.map((id, index) => [id, index]));
  return [...characters].sort((a, b) => (order.get(canonicalCharacterId(a.id)) ?? 10) - (order.get(canonicalCharacterId(b.id)) ?? 10));
}

export function handbookPuzzleLayout(mobile) {
  return geometry[mobile ? 'mobile' : 'desktop'];
}

// Offset each convex edge inward in CSS pixels. A single half-gap is shared
// by adjacent pieces, independent of their angle or bounding-box size.
export function insetHandbookPiece(piece, { width, height }, halfGap = 1.5) {
  const points = piece.points.map(([x, y]) => [x * width / 100, y * height / 100]);
  const signedArea = points.reduce((area, [x, y], index) => {
    const [nextX, nextY] = points[(index + 1) % points.length];
    return area + x * nextY - nextX * y;
  }, 0);
  // Reversing the vertex order must not reverse the direction of the inset.
  const offset = halfGap * (signedArea < 0 ? -1 : 1);
  const lines = points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    const dx = next[0] - point[0], dy = next[1] - point[1];
    const length = Math.hypot(dx, dy);
    return { point: [point[0] - dy * offset / length, point[1] + dx * offset / length], direction: [dx, dy] };
  });
  return lines.map((line, index) => {
    const previous = lines[(index + lines.length - 1) % lines.length];
    const [ax, ay] = previous.direction, [bx, by] = line.direction;
    const denominator = ax * by - ay * bx;
    if (Math.abs(denominator) < 0.000001) return points[index].map((value, axis) => value * 100 / (axis ? height : width));
    const dx = line.point[0] - previous.point[0], dy = line.point[1] - previous.point[1];
    const distance = (dx * by - dy * bx) / denominator;
    return [(previous.point[0] + ax * distance) * 100 / width, (previous.point[1] + ay * distance) * 100 / height];
  });
}
