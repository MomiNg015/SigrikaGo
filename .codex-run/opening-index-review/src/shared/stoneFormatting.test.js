import { describe, expect, it } from "vitest";
import { formatStones } from "./stoneFormatting.js";

describe("stone formatting", () => {
  it("formats whole and fractional stone counts", () => {
    expect(formatStones(0)).toBe("0");
    expect(formatStones(2)).toBe("2");
    expect(formatStones(2.75)).toBe("2又3/4");
    expect(formatStones(0.5)).toBe("1/2");
    expect(formatStones(-1.25)).toBe("-1又1/4");
  });

  it("falls back to zero for non-finite values", () => {
    expect(formatStones(Number.NaN)).toBe("0");
    expect(formatStones(Infinity)).toBe("0");
  });
});
