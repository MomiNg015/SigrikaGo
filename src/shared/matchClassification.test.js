import { describe, expect, it } from "vitest";
import { rankDistance, roomMatchClassification } from "./matchClassification.js";

describe("match classification", () => {
  it.each([["3段", "5段", 2], ["6段", "9段", 3], ["1级", "1段", 1], ["2级", "1段", 2]])("measures %s to %s", (a, b, distance) => {
    expect(rankDistance(a, b)).toBe(distance);
    expect(rankDistance(b, a)).toBe(distance);
  });
  it("uses the frozen rated flag and excludes independent modes", () => {
    expect(roomMatchClassification({ rated: true }).label).toBe("升降级对局");
    expect(roomMatchClassification({ rated: false }).label).toBe("友谊对局");
    for (const room of [{ team: {} }, { practice: {} }, { sigrikaCandyDuel: {} }]) {
      expect(roomMatchClassification(room)).toBeNull();
    }
  });
});
