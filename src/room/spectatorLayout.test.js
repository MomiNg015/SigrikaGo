import { describe, expect, it } from "vitest";
import { placeSpectators, spectatorFreeRects, spectatorHitPolygon } from "./spectatorLayout.js";

const inside = (p, r) => p.x > r.x && p.x < r.x + r.width && p.y > r.y && p.y < r.y + r.height;
const entries = Array.from({ length: 20 }, (_, slot) => ({ user: { id: `user-${slot}` }, slot, seed: slot * 73 + 817 }));

describe("window-space spectator layout", () => {
  it("subtracts overlapping occupied surfaces without double-counting or covering controls", () => {
    const blockers = [{ x: 20, y: 20, width: 50, height: 50 }, { x: 40, y: 40, width: 40, height: 40 }];
    const free = spectatorFreeRects(100, 100, blockers);
    expect(free.reduce((area, r) => area + r.width * r.height, 0)).toBe(6800);
    for (let x = 0.5; x < 100; x += 3) for (let y = 0.5; y < 100; y += 3) {
      const point = { x, y };
      expect(free.filter((r) => inside(point, r)).length).toBe(blockers.some((r) => inside(point, r)) ? 0 : 1);
    }
  });

  it("scatters centers across the free window with bounded static rotations", () => {
    const blockers = [{ x: 220, y: 100, width: 560, height: 620 }];
    const free = spectatorFreeRects(1000, 800, blockers);
    const positions = placeSpectators(entries, free);
    expect(Object.keys(positions)).toHaveLength(20);
    for (const point of Object.values(positions)) {
      expect(free.some((r) => inside(point, r))).toBe(true);
      expect(point.rotation).toBeGreaterThanOrEqual(-30);
      expect(point.rotation).toBeLessThanOrEqual(30);
    }
    expect(new Set(Object.values(positions).map((p) => p.x)).size).toBe(20);
    expect(new Set(Object.values(positions).map((p) => p.y)).size).toBe(20);
    expect(placeSpectators(entries, free)).toEqual(positions);
  });

  it("keeps occupied centers stable on joins and only moves centers invalidated by geometry", () => {
    const free = spectatorFreeRects(1000, 800, []);
    const original = placeSpectators(entries.slice(0, 5), free);
    const joined = placeSpectators(entries.slice(0, 6).reverse(), free, original);
    for (const [id, point] of Object.entries(original)) expect(joined[id]).toEqual(point);
    const first = original[entries[0].user.id];
    const blocked = spectatorFreeRects(1000, 800, [{ x: first.x - 3, y: first.y - 3, width: 6, height: 6 }]);
    const moved = placeSpectators(entries.slice(0, 5), blocked, original);
    expect(moved[entries[0].user.id]).not.toEqual(first);
    for (const entry of entries.slice(1, 5)) expect(moved[entry.user.id]).toEqual(original[entry.user.id]);
    expect(moved[entries[0].user.id].rotation).toBe(first.rotation);
  });

  it("handles an entirely occupied window and gives neighboring portraits separate hit regions", () => {
    expect(placeSpectators(entries, [])).toEqual({});
    const a = { x: 50, y: 50 }, b = { x: 150, y: 50 };
    const polygon = spectatorHitPolygon(a, [a, b], 180, 200);
    const coordinates = [...polygon.matchAll(/(-?\d+\.\d+)px (-?\d+\.\d+)px/g)];
    expect(coordinates.every((match) => Number(match[1]) <= 100)).toBe(true);
    expect(coordinates.some((match) => Number(match[1]) === 100)).toBe(true);
  });

  it("keeps the original full-art frame at 80 percent regardless of crowd size", () => {
    const free = spectatorFreeRects(390, 844, []);
    for (const count of [1, 6, 20]) {
      const placed = Object.values(placeSpectators(entries.slice(0, count), free, {}, { width: 390 }));
      expect(placed).toHaveLength(count);
      for (const point of placed) {
        expect(point.width).toBe(144);
        expect(point.height).toBe(160);
        expect(point.name.x).toBeGreaterThanOrEqual(0);
        expect(point.name.x + point.name.width).toBeLessThanOrEqual(390);
        expect(point.name.y).toBeGreaterThan(point.y);
        expect(point.name.y + point.name.height).toBeLessThanOrEqual(844);
        expect(point.art.height).toBeGreaterThanOrEqual(point.height);
        for (const other of placed.filter((candidate) => candidate !== point)) {
          expect(inside(other, { x: point.name.x - 7, y: point.name.y - 7,
            width: point.name.width + 14, height: point.name.height + 14 })).toBe(false);
        }
      }
    }
    const desktop = Object.values(placeSpectators(entries.slice(0, 1), spectatorFreeRects(1440, 1000, []), {}, { width: 1440 }))[0];
    expect([desktop.width, desktop.height]).toEqual([192, 232]);
  });
});
