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
  SHOP_MASCOT_DEFAULT_IMAGE,
  SHOP_MASCOT_LINES,
  SHOP_MASCOT_MOODS,
  SHOP_MASCOT_THANKS_DURATION_MS,
  SHOP_MASCOT_THANKS_IMAGE,
  SHOP_MASCOT_THANKS_LINE
} from "./shopModalHelpers.js";
import {
  getShopItemDetailOwned,
  getShopItemDetailStatus,
  getShopOwnedItemQuantity
} from "./shop/shopItemDetail.js";
import ShopModal from "./ShopModal.jsx";
import ShopItemCard from "./shop/ShopItemCard.jsx";
import ShopItemDetailDialog from "./shop/ShopItemDetailDialog.jsx";
import ShopSidebar from "./shop/ShopSidebar.jsx";
import {
  clearShopMascotThanksTimer,
  scheduleShopMascotThanks
} from "./shop/useShopCatalog.js";
import { readCssWithImports } from "../styles/cssTestUtils.js";

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
    expect(html).toContain(SHOP_MASCOT_DEFAULT_IMAGE);
    expect(html).toContain(SHOP_MASCOT_THANKS_IMAGE);
    expect(html).toContain('decoding="async"');
    expect(html).not.toContain("<h2");
    expect(html).not.toContain("shop-header-display");
  });

  it("renders default and thank-you shop mascot portraits as preloaded crossfade layers", () => {
    const defaultHtml = renderToStaticMarkup(createElement(ShopSidebar, {
      mascotLine: "欢迎来到扎希拉商店！",
      mascotMood: SHOP_MASCOT_MOODS.default,
      user: { coins: 180 }
    }));
    const thanksHtml = renderToStaticMarkup(createElement(ShopSidebar, {
      mascotLine: SHOP_MASCOT_THANKS_LINE,
      mascotMood: SHOP_MASCOT_MOODS.thanks,
      user: { coins: 180 }
    }));

    expect(defaultHtml).toContain(`src="${SHOP_MASCOT_DEFAULT_IMAGE}"`);
    expect(defaultHtml).toContain(`src="${SHOP_MASCOT_THANKS_IMAGE}"`);
    expect(defaultHtml).toContain(`data-mascot-mood="${SHOP_MASCOT_MOODS.default}"`);
    expect(defaultHtml).toContain('class="shop-mascot-image shop-mascot-image-default is-active"');
    expect(defaultHtml).toContain('class="shop-mascot-image shop-mascot-image-thanks"');
    expect(defaultHtml).toContain('width="1448"');
    expect(defaultHtml).toContain('height="1054"');
    expect(defaultHtml).toContain('aria-live="polite"');
    expect(defaultHtml).toContain('aria-hidden="true"');
    expect(thanksHtml).toContain(`src="${SHOP_MASCOT_DEFAULT_IMAGE}"`);
    expect(thanksHtml).toContain(`src="${SHOP_MASCOT_THANKS_IMAGE}"`);
    expect(thanksHtml).toContain(`data-mascot-mood="${SHOP_MASCOT_MOODS.thanks}"`);
    expect(thanksHtml).toContain('class="shop-mascot-image shop-mascot-image-default"');
    expect(thanksHtml).toContain('class="shop-mascot-image shop-mascot-image-thanks is-active"');
    expect(thanksHtml).toContain(SHOP_MASCOT_THANKS_LINE);
  });

  it("keeps shop mascot WebP assets lossless at source dimensions", () => {
    expect(webpInfo("../../public/assets/zahira_shop_default.webp")).toEqual({
      encoding: "VP8L",
      width: 1448,
      height: 1054
    });
    expect(webpInfo("../../public/assets/zahira_shop_laugh.webp")).toEqual({
      encoding: "VP8L",
      width: 1448,
      height: 1054
    });
  });

  it("hides the shop blue-gem wallet while keeping the coin wallet visible", () => {
    const html = renderToStaticMarkup(createElement(ShopModal, {
      token: "token",
      user: { coins: 90610, blueGems: 12, ownedCharacters: [], ownedDecorations: [] },
      onPurchased: () => {},
      onClose: () => {}
    }));
    const baseShopCss = readCssWithImports(new URL("../styles/commerce-settings.css", import.meta.url));

    expect(html).toContain("shop-wallet");
    expect(html).toContain("90610");
    expect(html).not.toContain("blue-gem-wallet");
    expect(html).not.toContain(">12</p>");
    expect(baseShopCss).toContain(".shop-wallet-wrap");
  });

  it("adds category hooks for tactical rarity glow styling", () => {
    const source = readFileSync(new URL("./shop/ShopItemCard.jsx", import.meta.url), "utf8");
    const html = renderToStaticMarkup(createElement(ShopModal, {
      token: "token",
      user: { coins: 90610, ownedCharacters: [], ownedDecorations: [] },
      onPurchased: () => {},
      onClose: () => {}
    }));

    expect(html).toContain("shop-category-item");
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

  it("renders optional shop item illustration credits without changing link styling", () => {
    const baseItem = {
      id: "test-card",
      category: "item",
      targetId: "rainbow-bean-candy",
      name: "测试商品",
      description: "商品说明",
      imageUrl: "/assets/items/rainbow-bean-candy.webp"
    };
    const linkedHtml = renderToStaticMarkup(createElement(ShopItemDetailDialog, {
      item: { ...baseItem, illustName: "画师", illustUrl: "https://example.com/artist" },
      user: {},
      onClose: () => {}
    }));
    const plainHtml = renderToStaticMarkup(createElement(ShopItemDetailDialog, {
      item: { ...baseItem, illustName: "画师", illustUrl: "" },
      user: {},
      onClose: () => {}
    }));
    const noCreditHtml = renderToStaticMarkup(createElement(ShopItemDetailDialog, {
      item: baseItem,
      user: {},
      onClose: () => {}
    }));
    const unsafeLinkHtml = renderToStaticMarkup(createElement(ShopItemDetailDialog, {
      item: { ...baseItem, illustName: "画师", illustUrl: "javascript:alert(1)" },
      user: {},
      onClose: () => {}
    }));
    const commerceCss = readCssWithImports(new URL("../styles/commerce-settings.css", import.meta.url));
    const themesCss = readCssWithImports(new URL("../styles/themes/bright-school.css", import.meta.url));
    const mobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));

    expect(linkedHtml).toContain("class=\"shop-detail-illust-label\"");
    expect(linkedHtml).toContain("illust：画师");
    expect(linkedHtml).toContain("target=\"_blank\"");
    expect(linkedHtml).toContain("rel=\"noreferrer\"");
    expect(plainHtml).toContain("<span class=\"shop-detail-illust-label\">illust：画师</span>");
    expect(noCreditHtml).not.toContain("shop-detail-illust-label");
    expect(unsafeLinkHtml).toContain("<span class=\"shop-detail-illust-label\">illust：画师</span>");
    expect(commerceCss).toMatch(/\.shop-detail-title-row\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*baseline;/s);
    expect(commerceCss).toMatch(/\.shop-detail-illust-label\s*\{[^}]*display:\s*block;[^}]*min-height:\s*0;[^}]*border:\s*0;[^}]*border-radius:\s*0;[^}]*background:\s*transparent;[^}]*color:\s*inherit;[^}]*text-decoration:\s*none;[^}]*white-space:\s*nowrap;/s);
    expect(commerceCss).toContain(".shop-detail-illust-label:visited");
    expect(themesCss).toMatch(/\.shop-detail-illust-label\s*\{[^}]*min-height:\s*0\s*!important;[^}]*background:\s*transparent\s*!important;[^}]*color:\s*inherit\s*!important;[^}]*border:\s*0\s*!important;[^}]*border-radius:\s*0\s*!important;[^}]*text-decoration:\s*none\s*!important;/s);
    expect(themesCss).toContain(".shop-detail-illust-label:link");
    expect(mobileCss).toContain(".shop-detail-title-row");
    expect(mobileCss).toContain("flex-direction: column");
    expect(mobileCss).toMatch(/\.shop-detail-illust-label\s*\{[^}]*border-radius:\s*0;[^}]*background:\s*transparent;/s);
  });

  it("keeps unavailable shop purchase actions native disabled controls", () => {
    const baseItem = {
      id: "test-card",
      category: "character",
      targetId: "sigrika",
      name: "test",
      priceCoins: 100,
      finalPrice: 100,
      discountPercent: 0,
      purchasable: true
    };
    const renderCard = (item, user) => renderToStaticMarkup(createElement(ShopItemCard, {
      item,
      index: 0,
      activeCategory: item.category,
      purchasingId: "",
      user,
      onBuy: () => {},
      onShowDetail: () => {}
    }));

    const ownedHtml = renderCard(baseItem, { coins: 200, ownedCharacters: ["sigrika"], ownedDecorations: [] });
    const soldOutHtml = renderCard({ ...baseItem, category: "item", targetId: "radio", stockQuantity: 1, remainingStock: 0 }, { coins: 200 });
    const tooExpensiveHtml = renderCard(baseItem, { coins: 1, ownedCharacters: [], ownedDecorations: [] });

    expect(ownedHtml).toContain("disabled=\"\"");
    expect(ownedHtml).toContain("shop-action-owned");
    expect(soldOutHtml).toContain("disabled=\"\"");
    expect(soldOutHtml).toContain("shop-action-sold-out");
    expect(tooExpensiveHtml).toContain("disabled=\"\"");
  });

  it("styles all unavailable shop purchase actions as gray across base, theme, and mobile layers", () => {
    const commerceCss = readCssWithImports(new URL("../styles/commerce-settings.css", import.meta.url));
    const themesCss = readCssWithImports(new URL("../styles/themes.css", import.meta.url));
    const mobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));

    expect(commerceCss).toContain(".shop-item .primary-action:disabled");
    expect(commerceCss).toContain("background: #d8d1cb;");
    expect(themesCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-item .primary-action:disabled");
    expect(themesCss).toContain("background: #d8d1cb !important;");
    expect(mobileCss).toContain(".shop-item .primary-action:disabled");
    expect(mobileCss).toContain(":is(.shop-category-character, .shop-category-item, .shop-category-decoration, .shop-category-music).shop-item .primary-action:disabled");
  });

  it("hides purchase-limit text and centers prices for character and decoration cards", () => {
    const baseItem = {
      id: "test-card",
      name: "测试商品",
      priceCoins: 100,
      finalPrice: 100,
      discountPercent: 0,
      purchasable: true
    };
    const renderCard = (category) => renderToStaticMarkup(createElement(ShopItemCard, {
      item: {
        ...baseItem,
        id: `test-${category}`,
        category,
        targetId: category === "decoration" ? "paw-stone" : "sigrika"
      },
      index: 0,
      activeCategory: category,
      purchasingId: "",
      user: { coins: 200, ownedCharacters: [], ownedDecorations: [] },
      onBuy: () => {},
      onShowDetail: () => {}
    }));

    const characterHtml = renderCard("character");
    const decorationHtml = renderCard("decoration");

    expect(characterHtml).not.toContain("限购");
    expect(decorationHtml).not.toContain("限购");
    expect(characterHtml).toContain("shop-card-meta-price-only");
    expect(decorationHtml).toContain("shop-card-meta-price-only");
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

  it("schedules the shop mascot thank-you state and refreshes repeated success timers", () => {
    const timerRef = { current: null };
    const moods = [];
    const clearedTimers = [];
    const scheduledTimers = [];
    const setMascotMood = (mood) => moods.push(mood);
    const setTimeoutFn = (callback, delayMs) => {
      const id = `timer-${scheduledTimers.length + 1}`;
      scheduledTimers.push({ id, callback, delayMs });
      return id;
    };
    const clearTimeoutFn = (id) => clearedTimers.push(id);

    scheduleShopMascotThanks({ timerRef, setMascotMood, setTimeoutFn, clearTimeoutFn });
    scheduleShopMascotThanks({ timerRef, setMascotMood, setTimeoutFn, clearTimeoutFn });

    expect(moods).toEqual([SHOP_MASCOT_MOODS.thanks, SHOP_MASCOT_MOODS.thanks]);
    expect(scheduledTimers.map((timer) => timer.delayMs)).toEqual([
      SHOP_MASCOT_THANKS_DURATION_MS,
      SHOP_MASCOT_THANKS_DURATION_MS
    ]);
    expect(clearedTimers).toEqual(["timer-1"]);
    expect(timerRef.current).toBe("timer-2");

    scheduledTimers[1].callback();

    expect(moods).toEqual([
      SHOP_MASCOT_MOODS.thanks,
      SHOP_MASCOT_MOODS.thanks,
      SHOP_MASCOT_MOODS.default
    ]);
    expect(timerRef.current).toBe(null);
  });

  it("cleans up pending shop mascot thank-you timers", () => {
    const timerRef = { current: "timer-1" };
    const clearedTimers = [];

    clearShopMascotThanksTimer(timerRef, (id) => clearedTimers.push(id));
    clearShopMascotThanksTimer(timerRef, (id) => clearedTimers.push(id));

    expect(clearedTimers).toEqual(["timer-1"]);
    expect(timerRef.current).toBe(null);
  });

  it("keeps shop mascot purchase feedback limited to successful purchases", () => {
    const source = readFileSync(new URL("./shop/useShopCatalog.js", import.meta.url), "utf8");
    const successStart = source.indexOf("const data = await api(`/api/shop/${item.id}/purchase`");
    const catchStart = source.indexOf("} catch", successStart);
    const successBlock = source.slice(successStart, catchStart);
    const catchBlock = source.slice(catchStart, source.indexOf("} finally", catchStart));

    expect(successBlock).toContain("scheduleShopMascotThanks");
    expect(catchBlock).not.toContain("scheduleShopMascotThanks");
    expect(source).toMatch(/useEffect\(\(\) => \(\) => clearShopMascotThanksTimer\(mascotResetTimerRef\), \[\]\);/);
    expect(source).toContain("mascotMood === SHOP_MASCOT_MOODS.thanks ? SHOP_MASCOT_THANKS_LINE : initialMascotLine");
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
    const css = readCssWithImports(new URL("../styles/commerce-settings.css", import.meta.url));
    const shopGridBlock = css.match(/\.shop-grid\s*\{[^}]+\}/)?.[0] ?? "";

    expect(shopGridBlock).toContain("overflow: auto");
    expect(shopGridBlock).toContain("align-content: safe center");
  });

  it("keeps the desktop shop mascot full-width with the wallet at 30 percent and greeting 5 percent above the portrait", () => {
    const commerceCss = readCssWithImports(new URL("../styles/commerce-settings.css", import.meta.url));
    const brightShopCss = readCssWithImports(new URL("../styles/themes/bright-school/commerce/shop.css", import.meta.url));
    const baseSidebarBlock = cssBlock(commerceCss, ".shop-sidebar");
    const baseWalletWrapBlock = cssBlock(commerceCss, ".shop-wallet-wrap");
    const baseMascotSlotBlock = cssBlock(commerceCss, ".shop-mascot-slot");
    const baseMascotImageBlock = cssBlock(commerceCss, ".shop-mascot-slot img");
    const baseMascotLayerBlock = cssBlock(commerceCss, ".shop-mascot-image");
    const baseMascotActiveBlock = cssBlock(commerceCss, ".shop-mascot-image.is-active");
    const brightSidebarBlock = cssBlock(
      brightShopCss,
      ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-sidebar"
    );
    const brightWalletWrapBlock = cssBlock(
      brightShopCss,
      ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-wallet-wrap"
    );
    const brightMascotSlotBlock = cssBlock(
      brightShopCss,
      ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-mascot-slot"
    );
    const brightMascotImageBlock = cssBlock(
      brightShopCss,
      ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-mascot-slot img"
    );

    expect(baseSidebarBlock).toContain('grid-template-areas:\n    "."\n    "bubble"\n    "."\n    "mascot";');
    expect(baseSidebarBlock).toContain("grid-template-rows: minmax(0, 1fr) auto minmax(18px, 5%) auto;");
    expect(baseSidebarBlock).toContain("position: relative;");
    expect(baseSidebarBlock).toContain("padding: 0;");
    expect(baseWalletWrapBlock).toContain("position: absolute;");
    expect(baseWalletWrapBlock).toContain("top: 30%;");
    expect(baseWalletWrapBlock).toContain("left: 50%;");
    expect(baseWalletWrapBlock).toContain("transform: translate(-50%, -50%);");
    expect(baseMascotSlotBlock).toContain("grid-area: mascot;");
    expect(baseMascotSlotBlock).toContain("align-self: end;");
    expect(baseMascotSlotBlock).toContain("width: 100%;");
    expect(baseMascotSlotBlock).toContain("height: auto;");
    expect(baseMascotImageBlock).toContain("width: 100%;");
    expect(baseMascotImageBlock).toContain("height: auto;");
    expect(baseMascotLayerBlock).toContain("grid-area: 1 / 1;");
    expect(baseMascotLayerBlock).toContain("opacity: 0;");
    expect(baseMascotLayerBlock).toContain("transition: opacity 120ms ease-out;");
    expect(baseMascotActiveBlock).toContain("opacity: 1;");
    expect(brightSidebarBlock).toContain('grid-template-areas:\n    "."\n    "bubble"\n    "."\n    "mascot" !important;');
    expect(brightSidebarBlock).toContain("grid-template-rows: minmax(0, 1fr) auto minmax(18px, 5%) auto !important;");
    expect(brightShopCss).toContain("padding: 0 7px 7px 0 !important");
    expect(brightShopCss).toContain("box-sizing: border-box !important");
    expect(brightWalletWrapBlock).toContain("position: absolute !important;");
    expect(brightWalletWrapBlock).toContain("top: 30% !important;");
    expect(brightWalletWrapBlock).toContain("left: 50% !important;");
    expect(brightWalletWrapBlock).toContain("transform: translate(-50%, -50%) !important;");
    expect(brightMascotSlotBlock).toContain("align-self: end !important;");
    expect(brightMascotSlotBlock).toContain("width: 100% !important;");
    expect(brightMascotImageBlock).toContain("width: 100% !important;");
    expect(brightMascotImageBlock).toContain("height: auto !important;");
    expect(brightMascotImageBlock).toContain("max-height: none !important;");
  });

  it("keeps mobile shop mascot in the right-bottom 50 percent lane without covering wallet or greeting", () => {
    const mobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));
    const brightMobileShopCss = readCssWithImports(
      new URL("../styles/themes/bright-school/mobile/commerce-warehouse/shop-layout.css", import.meta.url)
    );
    const finalWalletCss = readCssWithImports(
      new URL("../styles/mobile-adaptive/bright-school-portrait/shop-wallet.css", import.meta.url)
    );

    expect(mobileCss).toContain("grid-template-columns: minmax(0, 1fr) minmax(0, 50%);");
    expect(mobileCss).toContain('grid-template-areas:\n      "bubble mascot"\n      "wallet mascot";');
    expect(mobileCss).toContain("padding: 8px 0 0 8px;");
    expect(mobileCss).toContain("grid-area: mascot;");
    expect(mobileCss).toContain("align-self: end;");
    expect(mobileCss).toContain("justify-self: end;");
    expect(mobileCss).toContain("height: auto;");
    expect(mobileCss).toContain("position: static;");
    expect(mobileCss).toContain("transform: none;");
    expect(brightMobileShopCss).toContain("grid-template-columns: minmax(0, 1fr) minmax(0, 50%) !important;");
    expect(brightMobileShopCss).toContain('grid-template-areas:\n      "bubble mascot"\n      "wallet mascot" !important;');
    expect(brightMobileShopCss).toContain("padding: 4px 7px 12px 4px !important");
    expect(brightMobileShopCss).toContain("padding: 12px 0 0 12px !important;");
    expect(brightMobileShopCss).toContain("align-self: end !important;");
    expect(brightMobileShopCss).toContain("justify-self: end !important;");
    expect(brightMobileShopCss).toContain("width: 100% !important;");
    expect(brightMobileShopCss).toContain("height: auto !important;");
    expect(brightMobileShopCss).toContain("max-height: none !important;");
    expect(brightMobileShopCss).toContain("position: static !important;");
    expect(brightMobileShopCss).toContain("transform: none !important;");
    expect(finalWalletCss).toContain("grid-area: wallet !important;");
    expect(finalWalletCss).toContain("align-self: end !important;");
    expect(finalWalletCss).toContain("justify-self: start !important;");
  });

  it("keeps Bright School mobile decoration shop cards self-contained", () => {
    const css = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));

    expect(css).toContain(".shop-content:is(.shop-category-character, .shop-category-item, .shop-category-decoration, .shop-category-music) .shop-grid");
    expect(css).toContain("grid-auto-rows: minmax(216px, auto) !important");
    expect(css).toContain(":is(.shop-category-character, .shop-category-item, .shop-category-decoration, .shop-category-music).shop-item");
    expect(css).toContain("display: flex !important");
    expect(css).toContain("overflow: hidden !important");
    expect(css).toContain(":is(.shop-category-character, .shop-category-item, .shop-category-decoration, .shop-category-music).shop-item .primary-action");
    expect(css).toContain("margin-top: auto !important");
    expect(css).toContain("align-self: stretch !important");
  });

  it("keeps Bright School mobile character shop cards self-contained", () => {
    const css = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));

    expect(css).toContain(".shop-content:is(.shop-category-character, .shop-category-item, .shop-category-decoration, .shop-category-music) .shop-grid");
    expect(css).toContain("grid-auto-rows: minmax(216px, auto) !important");
    expect(css).toContain(":is(.shop-category-character, .shop-category-item, .shop-category-decoration, .shop-category-music).shop-item");
    expect(css).toContain("flex-direction: column !important");
    expect(css).toContain(":is(.shop-category-character, .shop-category-item, .shop-category-music).shop-item > img");
    expect(css).toContain("min-height: 52px !important");
    expect(css).toContain("height: 52px !important");
    expect(css).toContain(":is(.shop-category-character, .shop-category-item, .shop-category-decoration, .shop-category-music).shop-item .primary-action");
    expect(css).toContain("margin-top: auto !important");
  });

  it("keeps Bright School mobile item shop cards aligned with decoration cards", () => {
    const css = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));

    expect(css).toContain(".shop-content:is(.shop-category-character, .shop-category-item, .shop-category-decoration, .shop-category-music) .shop-grid");
    expect(css).toContain(":is(.shop-category-item, .shop-category-music).shop-item > svg");
    expect(css).toContain("max-height: 52px !important");
    expect(css).toContain(":is(.shop-category-character, .shop-category-item, .shop-category-decoration, .shop-category-music).shop-item .shop-card-meta");
    expect(css).toContain("min-height: 30px !important");
  });

  it("keeps Bright School mobile music shop cards self-contained", () => {
    const css = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));

    expect(css).toContain(".shop-content.shop-category-music .shop-grid");
    expect(css).toContain("grid-auto-rows: minmax(224px, auto) !important");
    expect(css).toContain(".shop-category-music.shop-item");
    expect(css).toContain("display: flex !important");
    expect(css).toContain("min-height: 224px !important");
    expect(css).toContain(":is(.shop-category-character, .shop-category-item, .shop-category-music).shop-item > img");
    expect(css).toContain("flex: 0 0 52px !important");
    expect(css).toContain(".shop-category-music.shop-item .shop-card-meta");
    expect(css).toContain("display: grid !important");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) auto !important");
    expect(css).toContain(":is(.shop-category-character, .shop-category-item, .shop-category-decoration, .shop-category-music).shop-item .primary-action");
    expect(css).toContain("margin-top: auto !important");
  });

  it("keeps the Bright School mobile shop category tablist chrome-free", () => {
    const css = readCssWithImports(new URL("../styles/themes/bright-school.css", import.meta.url));

    expect(css).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-tabs");
    expect(css).toContain("padding: 0 !important");
    expect(css).toContain("border: 0 !important");
    expect(css).toContain("background: transparent !important");
    expect(css).toContain("box-shadow: none !important");
  });

  it("keeps Bright School mobile shop shadows inside padded clipping containers", () => {
    const css = readCssWithImports(new URL("../styles/themes/bright-school.css", import.meta.url));

    expect(css).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-layout");
    expect(css).toContain("padding: 4px 7px 12px 4px !important");
    expect(css).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-content");
    expect(css).toContain("padding: 2px 2px 6px !important");
    expect(css).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-grid");
    expect(css).toContain("padding: 2px 8px 12px 2px !important");
    expect(css).toContain("scroll-padding: 2px 8px 12px 2px !important");
  });

  it("centers character and decoration prices after removing the visible limit row", () => {
    const commerceCss = readCssWithImports(new URL("../styles/commerce-settings.css", import.meta.url));
    const mobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));
    const priceOnlyBlock = commerceCss.match(/\.shop-card-meta-price-only\s*\{[^}]+\}/)?.[0] ?? "";
    const priceOnlyPriceBlock = commerceCss.match(/\.shop-card-meta-price-only \.shop-price\s*\{[^}]+\}/)?.[0] ?? "";

    expect(priceOnlyBlock).toContain("justify-content: center");
    expect(priceOnlyPriceBlock).toContain("text-align: center");
    expect(mobileCss).toContain(":is(.shop-category-character, .shop-category-decoration).shop-item .shop-card-meta-price-only");
    expect(mobileCss).toContain(":is(.shop-category-character, .shop-category-decoration).shop-item .shop-card-meta-price-only .shop-price");
  });

  it("styles discounted original prices as a compact line above the current price", () => {
    const css = readCssWithImports(new URL("../styles/commerce-settings.css", import.meta.url));
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
    const modalCss = readCssWithImports(new URL("../styles/modals.css", import.meta.url));

    expect(modalCss).toContain("--terminal-bg: rgba(12, 22, 29, 0.85)");
    expect(modalCss).toContain("--terminal-cyan: #00ffbe");
    expect(modalCss).toContain("--terminal-blue: #00bfff");
    expect(modalCss).toContain("--terminal-text: #e0f7f4");
    expect(modalCss).toContain("backdrop-filter: blur(12px)");
    expect(modalCss).toContain("clip-path: polygon");
  });
});

function cssBlock(source, selector) {
  const start = source.indexOf(`${selector} {`);
  if (start < 0) return "";
  const bodyStart = source.indexOf("{", start);
  const bodyEnd = source.indexOf("}", bodyStart);
  return source.slice(start, bodyEnd + 1);
}

function webpInfo(path) {
  const buffer = readFileSync(new URL(path, import.meta.url));
  const losslessChunk = buffer.indexOf(Buffer.from("VP8L"));

  if (losslessChunk < 0) {
    return { encoding: "lossy", width: 0, height: 0 };
  }

  const byte0 = buffer[losslessChunk + 9];
  const byte1 = buffer[losslessChunk + 10];
  const byte2 = buffer[losslessChunk + 11];
  const byte3 = buffer[losslessChunk + 12];

  return {
    encoding: "VP8L",
    width: 1 + (((byte1 & 0x3f) << 8) | byte0),
    height: 1 + (((byte3 & 0x0f) << 10) | (byte2 << 2) | ((byte1 & 0xc0) >> 6))
  };
}
