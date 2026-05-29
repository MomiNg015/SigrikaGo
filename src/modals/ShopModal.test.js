import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import {
  buildShopSlots,
  getShopPageCount,
  getShopItemDescription,
  getShopItemQuantityLabel,
  isShopItemOwned,
  isShopItemSoldOut,
  pickShopMascotLine,
  SHOP_MASCOT_LINES
} from "./ShopModal.jsx";
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
    expect(html).toContain("你当前拥有");
    expect(html).toContain('decoding="async"');
    expect(html).not.toContain("<h2");
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

  it("marks per-user item stock as sold out from remainingStock", () => {
    expect(isShopItemSoldOut({ category: "item", stockQuantity: 10, remainingStock: 0 })).toBe(true);
    expect(isShopItemSoldOut({ category: "item", stockQuantity: 10, remainingStock: 1 })).toBe(false);
    expect(isShopItemSoldOut({ category: "item", stockQuantity: -1, remainingStock: -1 })).toBe(false);
    expect(isShopItemSoldOut({ category: "character", stockQuantity: 0, remainingStock: 0 })).toBe(false);
  });

  it("builds compact item description and quantity labels for shop cards", () => {
    expect(getShopItemDescription({ description: "  产地不明的糖果  " })).toBe("产地不明的糖果");
    expect(getShopItemDescription({})).toBe("暂无介绍");
    expect(getShopItemQuantityLabel({ category: "item", stockQuantity: 10, remainingStock: 4 })).toBe("库存 4");
    expect(getShopItemQuantityLabel({ category: "item", stockQuantity: -1 })).toBe("不限量");
    expect(getShopItemQuantityLabel({ category: "decoration" })).toBe("限购 1");
  });

  it("keeps the scrollable shop grid top reachable when viewport height is short", () => {
    const css = readFileSync(new URL("../styles/commerce-settings.css", import.meta.url), "utf8");
    const shopGridBlock = css.match(/\.shop-grid\s*\{[^}]+\}/)?.[0] ?? "";

    expect(shopGridBlock).toContain("overflow: auto");
    expect(shopGridBlock).toContain("align-content: safe center");
  });

  it("styles discounted original prices as a compact line above the current price", () => {
    const css = readFileSync(new URL("../styles/commerce-settings.css", import.meta.url), "utf8");
    const shopPriceBlock = css.match(/\.shop-price\s*\{[^}]+\}/)?.[0] ?? "";
    const priceNumberWrapBlock = css.match(/\.shop-price-number-wrap\s*\{[^}]+\}/)?.[0] ?? "";
    const originalPriceBlock = css.match(/\.shop-original-price\s*\{[^}]+\}/)?.[0] ?? "";

    expect(shopPriceBlock).toContain("align-items: baseline");
    expect(priceNumberWrapBlock).toContain("position: relative");
    expect(originalPriceBlock).toContain("position: absolute");
    expect(originalPriceBlock).toContain("right: 0");
    expect(originalPriceBlock).toContain("color: #df3f4f");
    expect(originalPriceBlock).toContain("font-size: 12px");
  });
});
