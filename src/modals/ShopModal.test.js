import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildShopSlots, getShopPageCount, isShopItemOwned, pickShopMascotLine, SHOP_MASCOT_LINES } from "./ShopModal.jsx";
import ShopModal from "./ShopModal.jsx";

describe("ShopModal helpers", () => {
  it("renders the shop as a left mascot column and right product column", () => {
    const html = renderToStaticMarkup(createElement(ShopModal, {
      token: "token",
      user: { coins: 90610, ownedCharacters: [], ownedDecorations: [] },
      onPurchased: () => {},
      onClose: () => {}
    }));

    expect(html).toContain("shop-layout");
    expect(html).toContain("shop-sidebar");
    expect(html).toContain("shop-content");
    expect(html).not.toContain("shop-header-display");
  });

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

  it("paginates shop slots in 8-item pages", () => {
    const items = Array.from({ length: 10 }, (_, index) => ({
      id: `character-${index + 1}`,
      category: "character"
    }));

    expect(getShopPageCount(items, "character")).toBe(2);
    expect(buildShopSlots(items, "character", 1).map((item) => item?.id)).toEqual([
      "character-1",
      "character-2",
      "character-3",
      "character-4",
      "character-5",
      "character-6",
      "character-7",
      "character-8"
    ]);
    const secondPageSlots = buildShopSlots(items, "character", 2);
    expect(secondPageSlots.slice(0, 2).map((item) => item?.id)).toEqual(["character-9", "character-10"]);
    expect(secondPageSlots.slice(2)).toEqual([null, null, null, null, null, null]);
  });

  it("selects one of the configured Zahiya shop lines", () => {
    expect(SHOP_MASCOT_LINES).toEqual([
      "今天想买些什么？",
      "刚刚进了一批好货哟~",
      "欢迎来到扎希拉商店！"
    ]);
    expect(pickShopMascotLine(() => 0)).toBe("今天想买些什么？");
    expect(pickShopMascotLine(() => 0.99)).toBe("欢迎来到扎希拉商店！");
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
