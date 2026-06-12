import { describe, expect, it } from "vitest";
import { validateGachaPoolInput } from "./adminGachaManagement.js";

describe("admin gacha management", () => {
  it("accepts a gacha pool without a featured prize", () => {
    const result = validateGachaPoolInput({
      name: "No Featured Pool",
      enabled: true,
      permanent: true,
      singleDrawPrice: 50,
      tenDrawPrice: 500,
      featuredPrizeIndex: null,
      prizes: [
        { type: "coins", targetId: "", quantity: 60, probabilityBasisPoints: 10000, enabled: true, name: "Coins" }
      ]
    });

    expect(result.ok).toBe(true);
    expect(result.value.featuredPrizeIndex).toBeNull();
    expect(result.value.featuredPrizeIndexes).toEqual([]);
  });

  it("accepts multiple featured prize indexes", () => {
    const result = validateGachaPoolInput({
      name: "Multi Featured Pool",
      enabled: true,
      permanent: true,
      singleDrawPrice: 50,
      tenDrawPrice: 500,
      featuredPrizeIndexes: [0, 1],
      prizes: [
        { type: "character", targetId: "denia", quantity: 1, probabilityBasisPoints: 5000, enabled: true, name: "Danea" },
        { type: "coins", targetId: "", quantity: 60, probabilityBasisPoints: 5000, enabled: true, name: "Coins" }
      ]
    });

    expect(result.ok).toBe(true);
    expect(result.value.featuredPrizeIndexes).toEqual([0, 1]);
    expect(result.value.featuredPrizeIndex).toBe(0);
  });
});
