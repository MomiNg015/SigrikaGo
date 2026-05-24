import { describe, expect, it } from "vitest";
import { buildShopSlots, isShopItemOwned } from "./ShopModal.jsx";

describe("ShopModal helpers", () => {
  it("keeps a stable 8-slot grid for the active category", () => {
    const items = [
      { id: "character-1", category: "character" },
      { id: "decoration-1", category: "decoration" }
    ];

    const slots = buildShopSlots(items, "character");

    expect(slots).toHaveLength(8);
    expect(slots[0]).toEqual(items[0]);
    expect(slots.slice(1)).toEqual(Array(7).fill(null));
  });

  it("checks ownership against the right user collection", () => {
    const user = {
      ownedCharacters: ["denia"],
      ownedDecorations: ["paw-stone"]
    };

    expect(isShopItemOwned({ category: "character", targetId: "denia" }, user)).toBe(true);
    expect(isShopItemOwned({ category: "decoration", targetId: "paw-stone" }, user)).toBe(true);
    expect(isShopItemOwned({ category: "character", targetId: "baconbits" }, user)).toBe(false);
  });
});
