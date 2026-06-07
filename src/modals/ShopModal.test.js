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
} from "./shopModalHelpers.js";
import {
  getShopItemDetailOwned,
  getShopItemDetailStatus,
  getShopOwnedItemQuantity
} from "./shop/shopItemDetail.js";
import ShopModal from "./ShopModal.jsx";

describe("ShopModal helpers", () => {
  it("keeps non-component helpers out of the component module for Fast Refresh", () => {
    const source = readFileSync(new URL("./ShopModal.jsx", import.meta.url), "utf8");

    expect(source).not.toMatch(/export\s+(const|function)\s+(SHOP_MASCOT_LINES|pickShopMascotLine|buildShopSlots|getShopPageCount)/);
  });

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
    expect(html).toContain("shop-wallet");
    expect(html).toContain('decoding="async"');
    expect(html).not.toContain("<h2");
    expect(html).not.toContain("shop-header-display");
  });

  it("adds category hooks for tactical rarity glow styling", () => {
    const source = readFileSync(new URL("./shop/ShopItemCard.jsx", import.meta.url), "utf8");
    const html = renderToStaticMarkup(createElement(ShopModal, {
      token: "token",
      user: { coins: 90610, ownedCharacters: [], ownedDecorations: [] },
      onPurchased: () => {},
      onClose: () => {}
    }));

    expect(html).toContain("shop-category-character");
    expect(source).toContain("store-owned-tag");
    expect(source).toContain("shop-item-empty terminal-locked-slot");
  });

  it("keeps shop cards compact and routes non-buy clicks to item details", () => {
    const cardSource = readFileSync(new URL("./shop/ShopItemCard.jsx", import.meta.url), "utf8");
    const modalSource = readFileSync(new URL("./ShopModal.jsx", import.meta.url), "utf8");
    const detailSource = readFileSync(new URL("./shop/ShopItemDetailDialog.jsx", import.meta.url), "utf8");

    expect(cardSource).not.toContain('<p className="shop-description">');
    expect(cardSource).toContain("onShowDetail");
    expect(cardSource).toContain("role=\"button\"");
    expect(cardSource).toContain("tabIndex={0}");
    expect(cardSource).toContain("event.stopPropagation()");
    expect(cardSource).toContain("shop-action-owned");
    expect(cardSource).toContain("shop-action-sold-out");
    expect(modalSource).toContain("ShopItemDetailDialog");
    expect(modalSource).toContain("setDetailItem");
    expect(detailSource).toContain("shop-detail-status-owned");
    expect(detailSource).not.toContain("getShopItemQuantityLabel");
    expect(detailSource).not.toContain("finalPrice");
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
    expect(SHOP_MASCOT_LINES).toHaveLength(3);
    expect(SHOP_MASCOT_LINES).toContain(pickShopMascotLine(() => 0));
    expect(SHOP_MASCOT_LINES).toContain(pickShopMascotLine(() => 0.99));
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

  it("formats shop detail ownership status by category", () => {
    const user = {
      ownedCharacters: ["denia"],
      ownedDecorations: ["paw-stone"],
      ownedItems: [{ itemId: "rainbow-bean-candy", quantity: 3 }]
    };

    expect(getShopOwnedItemQuantity({ category: "item", targetId: "rainbow-bean-candy" }, user)).toBe(3);
    expect(getShopItemDetailOwned({ category: "item", targetId: "rainbow-bean-candy" }, user)).toBe(true);
    expect(getShopItemDetailOwned({ category: "item", targetId: "missing" }, user)).toBe(false);
    expect(getShopItemDetailStatus({ category: "item", targetId: "rainbow-bean-candy" }, user)).toBe("拥有 3");
    expect(getShopItemDetailStatus({ category: "character", targetId: "denia" }, user)).toBe("已持有");
    expect(getShopItemDetailStatus({ category: "decoration", targetId: "paw-stone" }, user)).toBe("已持有");
    expect(getShopItemDetailStatus({ category: "character", targetId: "baconbits" }, user)).toBe("尚未拥有该角色");
  });

  it("marks per-user item stock as sold out from remainingStock", () => {
    expect(isShopItemSoldOut({ category: "item", stockQuantity: 10, remainingStock: 0 })).toBe(true);
    expect(isShopItemSoldOut({ category: "item", stockQuantity: 10, remainingStock: 1 })).toBe(false);
    expect(isShopItemSoldOut({ category: "item", stockQuantity: -1, remainingStock: -1 })).toBe(false);
    expect(isShopItemSoldOut({ category: "character", stockQuantity: 0, remainingStock: 0 })).toBe(false);
  });

  it("builds compact item description and quantity labels for shop cards", () => {
    expect(getShopItemDescription({ description: "  sample desc  " })).toBe("sample desc");
    expect(getShopItemDescription({})).toBeTruthy();
    expect(getShopItemQuantityLabel({ category: "item", stockQuantity: 10, remainingStock: 4 })).toContain("4");
    expect(getShopItemQuantityLabel({ category: "item", stockQuantity: -1 })).toBeTruthy();
    expect(getShopItemQuantityLabel({ category: "decoration" })).toContain("1");
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

  it("defines the shared Startorch tactical terminal modal system", () => {
    const modalCss = readFileSync(new URL("../styles/modals.css", import.meta.url), "utf8");

    expect(modalCss).toContain("--terminal-bg: rgba(12, 22, 29, 0.85)");
    expect(modalCss).toContain("--terminal-cyan: #00ffbe");
    expect(modalCss).toContain("--terminal-blue: #00bfff");
    expect(modalCss).toContain("--terminal-text: #e0f7f4");
    expect(modalCss).toContain("backdrop-filter: blur(12px)");
    expect(modalCss).toContain("clip-path: polygon");
  });
});
