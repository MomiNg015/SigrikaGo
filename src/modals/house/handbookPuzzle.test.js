import { afterEach, describe, expect, it } from "vitest";
import { CHARACTER_ALIASES } from "../../shared/characterAliases.js";
import {
  handbookPuzzleLayout, insetHandbookPiece, orderHandbookCharacters,
} from "./handbookPuzzle.js";

const layouts = [
  { name: "desktop", mobile: false, size: { width: 830, height: 498 }, halfGap: 1.5 },
  { name: "mobile", mobile: true, size: { width: 330, height: 504 }, halfGap: 1 },
];
const EPSILON = 1e-7;

function signedArea(points) {
  return points.reduce((sum, [x, y], index) => {
    const [nextX, nextY] = points[(index + 1) % points.length];
    return sum + x * nextY - nextX * y;
  }, 0) / 2;
}

function edgeCross(start, end, point) {
  return (end[0] - start[0]) * (point[1] - start[1])
    - (end[1] - start[1]) * (point[0] - start[0]);
}

function edges(points) {
  return points.map((start, index) => [start, points[(index + 1) % points.length]]);
}

function pointInside(point, polygon) {
  const winding = Math.sign(signedArea(polygon));
  return edges(polygon).every(([start, end]) => winding * edgeCross(start, end, point) >= -EPSILON);
}

function intersection(subject, clippingPolygon) {
  let result = subject;
  const winding = Math.sign(signedArea(clippingPolygon));
  for (const [start, end] of edges(clippingPolygon)) {
    const input = result;
    result = [];
    for (const [from, to] of edges(input)) {
      const fromSide = winding * edgeCross(start, end, from);
      const toSide = winding * edgeCross(start, end, to);
      const fromInside = fromSide >= -EPSILON;
      const toInside = toSide >= -EPSILON;
      if (fromInside) result.push(from);
      if (fromInside !== toInside) {
        const fraction = fromSide / (fromSide - toSide);
        result.push([
          from[0] + (to[0] - from[0]) * fraction,
          from[1] + (to[1] - from[1]) * fraction,
        ]);
      }
    }
  }
  return result;
}

function sharedEdges(pieces) {
  const registry = new Map();
  pieces.forEach((piece, pieceIndex) => {
    edges(piece.points).forEach(([start, end], edgeIndex) => {
      const key = [start.join(","), end.join(",")].sort().join(";");
      const entries = registry.get(key) ?? [];
      entries.push({ start, end, pieceIndex, edgeIndex });
      registry.set(key, entries);
    });
  });
  return [...registry.values()];
}

function toPixels(points, { width, height }) {
  return points.map(([x, y]) => [x * width / 100, y * height / 100]);
}

function edgeDistance(point, start, end) {
  return Math.abs(edgeCross(start, end, point)) / Math.hypot(end[0] - start[0], end[1] - start[1]);
}

describe.each(layouts)("$name handbook puzzle layout", ({ mobile }) => {
  const pieces = handbookPuzzleLayout(mobile);

  it("provides ten convex pieces within the board", () => {
    expect(pieces).toHaveLength(10);
    for (const { points } of pieces) {
      expect(points.length).toBeGreaterThanOrEqual(4);
      expect(Math.abs(signedArea(points))).toBeGreaterThan(0);
      const winding = Math.sign(signedArea(points));
      points.forEach((point, index) => {
        expect(point.every((value) => Number.isFinite(value) && value >= 0 && value <= 100)).toBe(true);
        expect(winding * edgeCross(point, points[(index + 1) % points.length],
          points[(index + 2) % points.length])).toBeGreaterThan(0);
      });
    }
  });

  it("covers the rectangle completely with exactly matched interior edges", () => {
    const totalArea = pieces.reduce((sum, { points }) => sum + Math.abs(signedArea(points)), 0);
    expect(totalArea).toBeCloseTo(10000, 7);
    for (const entries of sharedEdges(pieces)) {
      const { start, end } = entries[0];
      const boundary = (start[0] === end[0] && [0, 100].includes(start[0]))
        || (start[1] === end[1] && [0, 100].includes(start[1]));
      expect(entries).toHaveLength(boundary ? 1 : 2);
    }
  });

  it("has no positive-area intersection between any pair of pieces", () => {
    for (let first = 0; first < pieces.length; first += 1) {
      for (let second = first + 1; second < pieces.length; second += 1) {
        const overlap = intersection(pieces[first].points, pieces[second].points);
        expect(Math.abs(signedArea(overlap))).toBeLessThan(EPSILON);
      }
    }
  });

  it("keeps every piece near one tenth of the board area", () => {
    const areas = pieces.map(({ points }) => Math.abs(signedArea(points)));
    expect(Math.max(...areas) / Math.min(...areas)).toBeLessThanOrEqual(1.3);
    for (const area of areas) {
      expect(area).toBeGreaterThanOrEqual(800);
      expect(area).toBeLessThanOrEqual(1200);
    }
  });

  it("keeps the complete portrait safety rectangle within its own piece", () => {
    for (const { points, portraitRegion: { x, y, width, height, center } } of pieces) {
      expect(pointInside(center, points)).toBe(true);
      for (const corner of [[x, y], [x + width, y], [x + width, y + height], [x, y + height]]) {
        expect(pointInside(corner, points)).toBe(true);
      }
    }
  });
});

describe.each(layouts)("$name handbook piece inset at the actual board size", ({ mobile, size, halfGap }) => {
  const pieces = handbookPuzzleLayout(mobile);

  it.each([false, true])("moves every edge inward by halfGap with reversed winding=%s", (reverse) => {
    for (const piece of pieces) {
      const orderedPiece = { ...piece, points: reverse ? [...piece.points].reverse() : piece.points };
      const original = toPixels(orderedPiece.points, size);
      const inset = toPixels(insetHandbookPiece(orderedPiece, size, halfGap), size);
      expect(inset).toHaveLength(original.length);
      expect(Math.abs(signedArea(inset))).toBeLessThan(Math.abs(signedArea(original)));
      const winding = Math.sign(signedArea(original));
      inset.forEach((point, index) => {
        expect(point.every(Number.isFinite)).toBe(true);
        expect(pointInside(point, original)).toBe(true);
        expect(winding * edgeCross(point, inset[(index + 1) % inset.length],
          inset[(index + 2) % inset.length])).toBeGreaterThan(0);
      });
      edges(original).forEach(([start, end], index) => {
        expect(edgeDistance(inset[index], start, end)).toBeCloseTo(halfGap, 8);
        expect(edgeDistance(inset[(index + 1) % inset.length], start, end)).toBeCloseTo(halfGap, 8);
        expect(winding * edgeCross(start, end, inset[index])).toBeGreaterThan(0);
      });
    }
  });

  it("leaves a two-halfGap seam between adjacent inset edges", () => {
    const insetPolygons = pieces.map((piece) => toPixels(insetHandbookPiece(piece, size, halfGap), size));
    for (const entries of sharedEdges(pieces).filter((entry) => entry.length === 2)) {
      const [first, second] = entries;
      const a = insetPolygons[first.pieceIndex];
      const b = insetPolygons[second.pieceIndex];
      const aStart = a[first.edgeIndex];
      const aEnd = a[(first.edgeIndex + 1) % a.length];
      const bStart = b[second.edgeIndex];
      const bEnd = b[(second.edgeIndex + 1) % b.length];
      expect(edgeDistance(bStart, aStart, aEnd)).toBeCloseTo(halfGap * 2, 8);
      expect(edgeDistance(bEnd, aStart, aEnd)).toBeCloseTo(halfGap * 2, 8);
    }
  });

  it("does not overlap adjacent polygons after inserting the seams", () => {
    const insetPolygons = pieces.map((piece) => toPixels(insetHandbookPiece(piece, size, halfGap), size));
    for (let first = 0; first < pieces.length; first += 1) {
      for (let second = first + 1; second < pieces.length; second += 1) {
        expect(Math.abs(signedArea(intersection(insetPolygons[first], insetPolygons[second]))))
          .toBeLessThan(EPSILON);
      }
    }
  });

  it("preserves the original vertices when halfGap is zero", () => {
    pieces.forEach((piece) => {
      const result = insetHandbookPiece(piece, size, 0);
      result.forEach((point, index) => {
        expect(point[0]).toBeCloseTo(piece.points[index][0], 10);
        expect(point[1]).toBeCloseTo(piece.points[index][1], 10);
      });
    });
  });
});

afterEach(() => {
  delete CHARACTER_ALIASES.handbook_test_alias_aemeath;
});

describe("handbook character order", () => {
  const order = ["lynae", "aemeath", "mornye", "nabomo", "changli", "sigrika", "baconbits", "qiuyuan", "chisa", "denia"];

  it("uses the intended portrait order without mutating the input roster", () => {
    const input = order.toReversed().map((id) => ({ id }));
    const original = [...input];
    expect(orderHandbookCharacters(input).map(({ id }) => id)).toEqual(order);
    expect(input).toEqual(original);
    expect(orderHandbookCharacters(input)[0]).toBe(input[input.length - 1]);
  });

  it("orders aliases by canonical identity and preserves ties", () => {
    CHARACTER_ALIASES.handbook_test_alias_aemeath = "aemeath";
    const input = [{ id: "denia" }, { id: "handbook_test_alias_aemeath" },
      { id: "aemeath" }, { id: "lynae" }, { id: "  sigrika  " }];
    expect(orderHandbookCharacters(input).map(({ id }) => id)).toEqual([
      "lynae", "handbook_test_alias_aemeath", "aemeath", "  sigrika  ", "denia",
    ]);
  });

  it("retains unknown characters in their source order after known identities", () => {
    const input = [{ id: "future-second" }, { id: "denia" }, { id: "future-first" }, { id: "sigrika" }];
    expect(orderHandbookCharacters(input).map(({ id }) => id)).toEqual([
      "sigrika", "denia", "future-second", "future-first",
    ]);
  });
});
