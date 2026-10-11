import { presenceSeed } from "./spectatorPresence.js";

const contains = (rect, point) => point.x >= rect.x && point.x <= rect.x + rect.width
  && point.y >= rect.y && point.y <= rect.y + rect.height;

// Disjoint window-space rectangles: paint and pointer events share this mask.
export function spectatorFreeRects(width, height, blockers) {
  let free = [{ x: 0, y: 0, width, height }];
  for (const block of blockers) {
    free = free.flatMap((rect) => {
      const left = Math.max(rect.x, block.x), top = Math.max(rect.y, block.y);
      const right = Math.min(rect.x + rect.width, block.x + block.width);
      const bottom = Math.min(rect.y + rect.height, block.y + block.height);
      if (right <= left || bottom <= top) return [rect];
      return [
        { x: rect.x, y: rect.y, width: rect.width, height: top - rect.y },
        { x: rect.x, y: bottom, width: rect.width, height: rect.y + rect.height - bottom },
        { x: rect.x, y: top, width: left - rect.x, height: bottom - top },
        { x: right, y: top, width: rect.x + rect.width - right, height: bottom - top }
      ].filter((part) => part.width > 0 && part.height > 0);
    });
  }
  return free;
}

const intersectionArea = (a, b) => Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
  * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
const visibleArea = (box, free) => free.reduce((sum, rect) => sum + intersectionArea(box, rect), 0);
function geometry(x, y, width, height, rotation, username, viewport, labelOffset = 0) {
  const angle = Math.abs(rotation) * Math.PI / 180;
  const outerWidth = Math.cos(angle) * width + Math.sin(angle) * height;
  const outerHeight = Math.cos(angle) * height + Math.sin(angle) * width;
  const compact = viewport.width <= 900;
  const nameWidth = Math.min(compact ? 104 : width, Math.max(38, (username?.length ?? 4) * (compact ? 10 : 12) + 14));
  const nameHeight = compact ? 22 : 24;
  const nameX = Math.max(5, Math.min(viewport.width - nameWidth - 5, x - nameWidth / 2));
  const nameY = Math.min(y + height / 2 - 4, viewport.height - nameHeight - 5 - labelOffset);
  return { x, y, width, height, rotation,
    art: { x: x - outerWidth / 2, y: y - outerHeight / 2, width: outerWidth, height: outerHeight },
    name: { x: nameX, y: nameY, width: nameWidth, height: nameHeight }
  };
}

export function placeSpectators(entries, freeRects, previous = {}, viewport = {}) {
  const roomy = freeRects.filter((rect) => rect.width >= 24 && rect.height >= 24);
  const candidates = roomy.length ? roomy : freeRects.filter((rect) => rect.width >= 6 && rect.height >= 6);
  if (!candidates.length) return {};
  const area = candidates.reduce((sum, rect) => sum + rect.width * rect.height, 0);
  const compact = (viewport.width ?? Math.max(...freeRects.map((rect) => rect.x + rect.width))) <= 900;
  const bounds = { width: viewport.width ?? Math.max(...freeRects.map((rect) => rect.x + rect.width)),
    height: viewport.height ?? Math.max(...freeRects.map((rect) => rect.y + rect.height)) };
  // User-requested 80% of the original 180x200 / 240x290 full-art frames.
  const width = compact ? 144 : 192, height = compact ? 160 : 232;
  const placed = {};
  for (const entry of entries) {
    const old = previous[entry.user.id];
    if (old?.width === width && old.height === height && candidates.some((rect) => contains(rect, old))
      && old.name.x >= 0 && old.name.x + old.name.width <= bounds.width
      && old.name.y + old.name.height <= bounds.height) placed[entry.user.id] = old;
  }
  for (const entry of [...entries].sort((a, b) => a.slot - b.slot)) {
    if (placed[entry.user.id]) continue;
    let randomState = entry.seed;
    const random = () => {
      randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
      return randomState / 4294967296;
    };
    let best = null, bestScore = -Infinity;
    const rotation = presenceSeed(String(entry.seed) + ':rotation') % 61 - 30;
    for (let attempt = 0; attempt < 480; attempt += 1) {
      let choice = random() * area;
      const region = candidates.find((rect) => { choice -= rect.width * rect.height; return choice <= 0; }) ?? candidates.at(-1);
      const point = geometry(region.x + 2 + random() * (region.width - 4), region.y + 2 + random() * (region.height - 4), width, height, rotation, entry.user.username, bounds, compact ? random() * 30 : 0);
      if (point.name.y < point.y + 18) continue;
      const others = Object.values(placed);
      // Paper labels stay clickable without stealing another portrait's entry point.
      const labelCovers = (label, center) => contains({ x: label.x - 7, y: label.y - 7,
        width: label.width + 14, height: label.height + 14 }, center);
      if (others.some((other) => labelCovers(point.name, other) || labelCovers(other.name, point))) continue;
      const visible = visibleArea(point.art, freeRects) / (point.art.width * point.art.height);
      const nameVisible = visibleArea(point.name, freeRects) / (point.name.width * point.name.height);
      const face = { x: point.x - width * 0.22, y: point.y - height * 0.34, width: width * 0.44, height: height * 0.36 };
      const controlCut = Math.min(1, (viewport.controls ?? []).reduce((sum, rect) => sum + intersectionArea(face, rect), 0) / (face.width * face.height));
      const faceVisible = visibleArea(face, freeRects) / (face.width * face.height);
      const overlap = others.reduce((sum, other) => sum
        + intersectionArea(point.art, other.art) / (width * height)
        + intersectionArea(point.name, other.name) / (point.name.width * point.name.height) * 8, 0);
      const distance = Math.min(400, ...others.map((other) => Math.hypot(point.x - other.x, point.y - other.y)));
      const score = visible * 80 + faceVisible * 300 + nameVisible * 250 + Math.min(distance, 240) * 0.6 - overlap * 100 - controlCut * 280 + random() * 12;
      if (score > bestScore) { best = point; bestScore = score; }
    }
    if (best) placed[entry.user.id] = best;
  }
  return placed;
}

// Overlapping art stays natural; nearest-center hit regions keep every
// exposed center independently clickable without painting geometric seams.
export function spectatorHitPolygon(point, points, width, height) {
  let polygon = [
    { x: point.x - width / 2, y: point.y - height / 2 },
    { x: point.x + width / 2, y: point.y - height / 2 },
    { x: point.x + width / 2, y: point.y + height / 2 + 22 },
    { x: point.x - width / 2, y: point.y + height / 2 + 22 }
  ];
  for (const other of points) {
    if (other === point || (other.x === point.x && other.y === point.y)) continue;
    const dx = other.x - point.x, dy = other.y - point.y;
    const limit = (other.x ** 2 + other.y ** 2 - point.x ** 2 - point.y ** 2) / 2;
    const inside = (p) => dx * p.x + dy * p.y <= limit + 0.001;
    const next = [];
    for (let index = 0; index < polygon.length; index += 1) {
      const a = polygon[index], b = polygon[(index + 1) % polygon.length];
      if (inside(a)) next.push(a);
      if (inside(a) !== inside(b)) {
        const ratio = (limit - dx * a.x - dy * a.y) / (dx * (b.x - a.x) + dy * (b.y - a.y));
        next.push({ x: a.x + ratio * (b.x - a.x), y: a.y + ratio * (b.y - a.y) });
      }
    }
    polygon = next;
  }
  return `polygon(${polygon.map((p) => `${p.x.toFixed(2)}px ${p.y.toFixed(2)}px`).join(",")})`;
}
