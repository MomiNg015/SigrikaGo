import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import ShopModal from "./ShopModal.jsx";
import ShopItemCard from "./shop/ShopItemCard.jsx";
import ShopItemDetailDialog from "./shop/ShopItemDetailDialog.jsx";
import ShopSidebar from "./shop/ShopSidebar.jsx";
import { layoutShopCards } from "./shop/shopLayout.js";
import {
  buildShopCardPresentation,
  eligibleShopItems,
  getShopItemCategoryLabel,
  getShopItemDescription,
  getShopItemQuantityBadge,
  getShopItemQuantityLabel,
  isShopItemOwned,
  isShopItemSoldOut,
  pickShopMascotLine,
  selectShopBatch,
  SHOP_BATCH_SIZE,
  SHOP_MASCOT_DEFAULT_IMAGE,
  SHOP_MASCOT_EMPTY_LINE,
  SHOP_MASCOT_ERROR_LINE,
  SHOP_MASCOT_LINES,
  SHOP_MASCOT_LOADING_LINE,
  SHOP_MASCOT_MOODS,
  SHOP_MASCOT_REFRESH_LINES,
  SHOP_MASCOT_THANKS_DURATION_MS,
  SHOP_MASCOT_THANKS_IMAGE,
  SHOP_MASCOT_THANKS_LINE,
  SHOP_REFRESH_COOLDOWN_MS,
  SHOP_WALLET_IMAGE
} from "./shopModalHelpers.js";
import {
  getShopItemDetailOwned,
  getShopItemDetailStatus,
  getShopOwnedItemQuantity
} from "./shop/shopItemDetail.js";
import {
  clearShopMascotThanksTimer,
  scheduleShopMascotThanks
} from "./shop/useShopCatalog.js";
import { readCssWithImports } from "../styles/cssTestUtils.js";

const sampleItem = {
  id: "test-card",
  category: "item",
  targetId: "rainbow-bean-candy",
  name: "测试商品",
  description: "商品说明",
  imageUrl: "/assets/items/rainbow-bean-candy.webp",
  priceCoins: 100,
  finalPrice: 80,
  discountPercent: 20,
  stockQuantity: 10,
  remainingStock: 4,
  purchasable: true
};

describe("Zahira shop window", () => {
  it("renders the semantic refresh-title-close header and the new single product stage", () => {
    const html = renderToStaticMarkup(createElement(ShopModal, {
      token: "token",
      user: { id: "user-1", coins: 90610, ownedCharacters: [], ownedDecorations: [], ownedMusicIds: [] },
      onPurchased: () => {},
      onClose: () => {}
    }));

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-labelledby="shop-window-title"');
    expect(html).toContain("shop-refresh-button");
    expect(html).toContain("扎希拉商铺");
    expect(html).toContain("shop-close-button");
    const headerHtml = html.slice(html.indexOf("<header"), html.indexOf("</header>"));
    expect(headerHtml.indexOf("shop-refresh-button")).toBeLessThan(headerHtml.indexOf("shop-window-title"));
    expect(headerHtml.indexOf("shop-window-title")).toBeLessThan(headerHtml.indexOf("shop-close-button"));
    expect(html).toContain("shop-product-stage");
    expect(html).not.toContain("shop-tabs");
    expect(html).not.toContain("shop-pagination");
    expect(html).not.toContain("暂未上架");
    expect(html).toContain(SHOP_MASCOT_LOADING_LINE);
  });

  it("renders both mascot layers and the replaceable wallet raster", () => {
    const html = renderToStaticMarkup(createElement(ShopSidebar, {
      mascotLine: SHOP_MASCOT_THANKS_LINE,
      mascotMood: SHOP_MASCOT_MOODS.thanks,
      user: { coins: 180 }
    }));

    expect(html).toContain(`src="${SHOP_MASCOT_DEFAULT_IMAGE}"`);
    expect(html).toContain(`src="${SHOP_MASCOT_THANKS_IMAGE}"`);
    expect(html).toContain('shop-mascot-image-thanks is-active');
    expect(html).toContain(`src="${SHOP_WALLET_IMAGE}"`);
    expect(html).toContain('width="1024"');
    expect(html).toContain('height="768"');
    expect(html).toContain('aria-label="持有金币 180"');
  });

  it("keeps mascot and wallet WebP assets at their source dimensions", () => {
    expect(webpInfo("../../public/assets/zahira_shop_default.webp")).toEqual({ encoding: "VP8L", width: 1448, height: 1054 });
    expect(webpInfo("../../public/assets/zahira_shop_laugh.webp")).toEqual({ encoding: "VP8L", width: 1448, height: 1054 });
    expect(webpInfo("../../public/assets/shop/zahira-wallet-v1.webp")).toEqual({ encoding: "VP8L", width: 1024, height: 768 });
  });

  it("filters owned one-time goods and per-user sold-out consumables from new batches", () => {
    const items = [
      { ...sampleItem, id: "available", remainingStock: 1 },
      { ...sampleItem, id: "sold", remainingStock: 0 },
      { ...sampleItem, id: "owned", category: "decoration", targetId: "paw-stone" },
      { ...sampleItem, id: "music", category: "music", targetId: "track-a" }
    ];
    const user = { ownedDecorations: ["paw-stone"], ownedMusicIds: [] };

    expect(eligibleShopItems(items, user).map((item) => item.id)).toEqual(["available", "music"]);
  });

  it("selects at most five unique products and prioritizes the previous batch's unseen item", () => {
    const items = Array.from({ length: 6 }, (_, index) => ({
      ...sampleItem,
      id: `item-${index + 1}`,
      targetId: `target-${index + 1}`,
      stockQuantity: -1,
      remainingStock: -1
    }));
    const previousIds = items.slice(0, 5).map((item) => item.id);
    const batch = selectShopBatch(items, {}, previousIds, () => 0.4);

    expect(batch).toHaveLength(SHOP_BATCH_SIZE);
    expect(batch[0].id).toBe("item-6");
    expect(new Set(batch.map((item) => item.id)).size).toBe(batch.length);
  });

  it("creates fixed per-batch rotation and only 4-6px, 5-8s float parameters", () => {
    const presentation = buildShopCardPresentation([sampleItem], sequenceRandom([0, 0, 0, 0]))[0];
    expect(presentation.rotation).toBe(-2);
    expect(presentation.floatDistance).toBe(4);
    expect(presentation.floatDuration).toBe(5);
    expect(Math.abs(presentation.floatDelay)).toBe(0);
  });

  it("uses balanced desktop 2+3, 2+2, and 2+1 rows with safe seeded jitter", () => {
    const five = layoutShopCards({ width: 760, height: 540, count: 5, seed: 22 });
    const four = layoutShopCards({ width: 760, height: 540, count: 4, seed: 22 });
    const three = layoutShopCards({ width: 760, height: 540, count: 3, seed: 22 });
    const two = layoutShopCards({ width: 760, height: 540, count: 2, seed: 22 });
    const one = layoutShopCards({ width: 760, height: 540, count: 1, seed: 22 });
    const constrained = layoutShopCards({ width: 420, height: 330, count: 5, seed: 22 });

    expect(five).toHaveLength(5);
    expect(constrained).toHaveLength(5);
    expect(constrained.every((placement) => placement.scale < 1)).toBe(true);
    expectTwoRowTopology(five, 2, 760);
    expectTwoRowTopology(four, 2, 760);
    expectTwoRowTopology(three, 2, 760);
    expect(Math.abs(rowCenter(two) - 380)).toBeLessThanOrEqual(32);
    expect(Math.abs(rowCenter(one) - 380)).toBeLessThanOrEqual(32);

    for (const placements of [five, four, three, two, one]) {
      for (let left = 0; left < placements.length; left += 1) {
        for (let right = left + 1; right < placements.length; right += 1) {
          expect(overlap(placements[left], placements[right])).toBe(false);
          expect(cardSeparation(placements[left], placements[right])).toBeGreaterThanOrEqual(28);
        }
      }
    }
  });

  it("uses mobile 2+3 and 2+1 compositions, tighter gaps, wider cards, and sub-44px scaling", () => {
    const stageSource = readFileSync(new URL("./shop/ShopProductStage.jsx", import.meta.url), "utf8");
    const five = layoutShopCards({ width: 360, height: 470, count: 5, mobile: true });
    const four = layoutShopCards({ width: 351, height: 407, count: 4, mobile: true });
    const three = layoutShopCards({ width: 351, height: 407, count: 3, mobile: true });
    const tiny = layoutShopCards({ width: 100, height: 90, count: 5, mobile: true });

    expect(new Set(five.slice(0, 2).map((placement) => placement.y)).size).toBe(1);
    expect(new Set(five.slice(2).map((placement) => placement.y)).size).toBe(1);
    expect(five[2].y).toBeGreaterThan(five[0].y);
    expect(four[0].width).toBeGreaterThan(157);
    expect(four[1].x - (four[0].x + four[0].width)).toBeGreaterThanOrEqual(4);
    expect(four[1].x - (four[0].x + four[0].width)).toBeLessThanOrEqual(5);
    expect(four[2].y - (four[0].y + four[0].height)).toBeGreaterThanOrEqual(8);
    expect(four[0].y).toBeGreaterThanOrEqual(8);
    expect(407 - (four[3].y + four[3].height)).toBeGreaterThanOrEqual(8);
    expect(three[0].y).toBe(three[1].y);
    expect(three[2].y).toBeGreaterThan(three[0].y);
    expect(three[2].x + (three[2].width / 2)).toBeCloseTo(351 / 2);
    expect(tiny.every((placement) => placement.width < 44)).toBe(true);
    expect(stageSource).toContain('window.matchMedia("(max-width: 768px)").matches');
    expect(stageSource).not.toContain("size.width <= 760");
  });

  it("uses category and quantity corner badges while preserving card interactions and disabled states", () => {
    const availableHtml = renderCard(sampleItem, { coins: 200 });
    const soldOutHtml = renderCard({ ...sampleItem, remainingStock: 0 }, { coins: 200 });
    const unlimitedHtml = renderCard({ ...sampleItem, stockQuantity: -1, remainingStock: -1 }, { coins: 200 });
    const limitOneHtml = renderCard({ ...sampleItem, stockQuantity: 1, remainingStock: 1 }, { coins: 200 });
    const source = readFileSync(new URL("./shop/ShopItemCard.jsx", import.meta.url), "utf8");

    expect(availableHtml).toContain('aria-label="分类：道具"');
    expect(availableHtml).toContain('aria-label="剩余 4"');
    expect(availableHtml).toContain("shop-quantity-badge");
    expect(unlimitedHtml).toContain('aria-label="不限量"');
    expect(unlimitedHtml).toContain("∞");
    expect(limitOneHtml).not.toContain("shop-quantity-badge");
    expect(availableHtml).toContain("shop-original-price");
    expect(availableHtml).toContain("shop-item-detail-trigger");
    expect(availableHtml).toContain('aria-label="查看测试商品详情"');
    expect(availableHtml).not.toContain('role="button"');
    expect(soldOutHtml).toContain("已售罄");
    expect(soldOutHtml).toContain("disabled");
    expect(source).toContain("event.stopPropagation()");
    expect(source).not.toContain("openDetailFromKeyboard");
    expect(source).toContain('className="shop-item-detail-trigger"');
    expect(source).not.toContain("暂未上架");
  });

  it("does not show a limit line for one-time goods", () => {
    expect(getShopItemCategoryLabel({ category: "character" })).toBe("部员");
    expect(getShopItemCategoryLabel({ category: "decoration" })).toBe("棋子");
    expect(getShopItemQuantityBadge({ category: "decoration" })).toBe(null);
    expect(getShopItemQuantityBadge({ category: "item", stockQuantity: 1, remainingStock: 1 })).toBe(null);
    expect(getShopItemQuantityBadge({ category: "item", stockQuantity: -1 })).toEqual({ text: "∞", ariaLabel: "不限量" });
    expect(getShopItemQuantityLabel({ category: "decoration" })).toBe("");
    expect(getShopItemQuantityLabel({ category: "music" })).toBe("");
    expect(getShopItemQuantityLabel({ category: "item", stockQuantity: -1 })).toBe("不限量");
  });

  it("preserves detail copy, ownership status, and illustration credit behavior", () => {
    const user = {
      ownedCharacters: ["denia"],
      ownedDecorations: ["paw-stone"],
      ownedItems: [{ itemId: "rainbow-bean-candy", quantity: 3 }]
    };
    const html = renderToStaticMarkup(createElement(ShopItemDetailDialog, {
      item: { ...sampleItem, illustName: "画师", illustUrl: "https://example.com/artist" },
      user,
      onClose: () => {}
    }));

    expect(getShopOwnedItemQuantity(sampleItem, user)).toBe(3);
    expect(getShopItemDetailOwned(sampleItem, user)).toBe(true);
    expect(getShopItemDetailStatus(sampleItem, user)).toBe("拥有 3");
    expect(getShopItemDescription({ description: "  sample desc  " })).toBe("sample desc");
    expect(html).toContain("illust：画师");
    expect(html).toContain('target="_blank"');
  });

  it("keeps opening, refresh, loading, empty, failure, and purchase dialogue contracts", () => {
    expect(SHOP_MASCOT_LINES).toContain(pickShopMascotLine(() => 0));
    expect(SHOP_MASCOT_REFRESH_LINES).toContain(pickShopMascotLine(() => 0.99, SHOP_MASCOT_REFRESH_LINES));
    expect(SHOP_MASCOT_LOADING_LINE).toBe("稍等一下，我正在整理商品哦。");
    expect(SHOP_MASCOT_EMPTY_LINE).toBe("还在进货中哦，请下次再来吧。");
    expect(SHOP_MASCOT_ERROR_LINE).toBe("进货单好像出了点问题，请再试一次吧。");
    expect(SHOP_MASCOT_THANKS_LINE).toBe("谢谢惠顾！");
  });

  it("keeps refresh local, preloads the prepared batch, and uses the three-second cooldown", () => {
    const source = readFileSync(new URL("./shop/useShopCatalog.js", import.meta.url), "utf8");
    const refreshBlock = source.slice(source.indexOf("function refreshCatalog"), source.indexOf("const eligibleCount"));

    expect(SHOP_REFRESH_COOLDOWN_MS).toBe(3000);
    expect(source).toContain("preloadImageAssets(nextItems.map");
    expect(source).toContain("setPreparedBatch(nextPresentation)");
    expect(refreshBlock).not.toContain('api("/api/shop"');
    expect(refreshBlock).toContain("setCurrentBatch(preparedBatch)");
  });

  it("schedules thank-you feedback for five seconds and cleans repeated timers", () => {
    const timerRef = { current: null };
    const moods = [];
    const cleared = [];
    const scheduled = [];
    const setTimeoutFn = (callback, delayMs) => {
      const id = `timer-${scheduled.length + 1}`;
      scheduled.push({ id, callback, delayMs });
      return id;
    };

    scheduleShopMascotThanks({ timerRef, setMascotMood: (mood) => moods.push(mood), setTimeoutFn, clearTimeoutFn: (id) => cleared.push(id) });
    scheduleShopMascotThanks({ timerRef, setMascotMood: (mood) => moods.push(mood), setTimeoutFn, clearTimeoutFn: (id) => cleared.push(id) });
    expect(scheduled.map((entry) => entry.delayMs)).toEqual([SHOP_MASCOT_THANKS_DURATION_MS, SHOP_MASCOT_THANKS_DURATION_MS]);
    expect(cleared).toEqual(["timer-1"]);
    clearShopMascotThanksTimer(timerRef, (id) => cleared.push(id));
    expect(cleared).toEqual(["timer-1", "timer-2"]);
  });

  it("encodes no-scroll, fixed rotation, float pause, reduced-motion, and final mobile overrides in CSS", () => {
    const commerceCss = readCssWithImports(new URL("../styles/commerce-settings.css", import.meta.url));
    const themeCss = readCssWithImports(new URL("../styles/themes/bright-school.css", import.meta.url));
    const mobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));

    expect(commerceCss).toContain(".shop-product-stage");
    expect(commerceCss).toContain("overflow: hidden");
    expect(commerceCss).toContain("transform: rotate(var(--shop-card-rotation))");
    expect(commerceCss).toContain("--shop-card-float-travel: calc(var(--shop-card-float) * 2)");
    expect(commerceCss).toContain("translateY(calc(var(--shop-card-float-travel) * -0.5))");
    expect(commerceCss).toContain("animation-play-state: paused");
    expect(commerceCss).toContain(".shop-card-position .shop-corner-badge");
    expect(commerceCss).toContain(".shop-card-position .shop-quantity-badge");
    expect(commerceCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(themeCss).toContain(".shop-layout.shop-window-body");
    expect(themeCss).toContain(".shop-header h2");
    expect(themeCss).toContain("font-family: var(--font-window-title), var(--font-ui-default) !important");
    expect(themeCss).toContain("display: contents !important");
    expect(themeCss).toContain(".shop-category-badge-decoration");
    expect(themeCss).toContain("bottom: 52% !important");
    expect(mobileCss).toContain("height: 56% !important");
    expect(mobileCss).toContain("padding: 0 !important");
    expect(mobileCss).toContain("gap: 0 !important");
    expect(mobileCss).toContain("max-width: none !important");
    expect(mobileCss).toContain(".shop-window .shop-card-scale");
    expect(mobileCss).toContain(".shop-window .shop-card-position .shop-item");
    expect(mobileCss).toContain("grid-template-columns: minmax(0, 1fr) !important");
    expect(mobileCss).toContain("justify-content: stretch !important");
    expect(mobileCss).toContain("justify-items: stretch !important");
    expect(mobileCss).toContain("grid-template-rows: minmax(0, 1fr) 34px !important");
    expect(mobileCss).toContain("grid-template-rows: 88px 22px 24px !important");
    expect(mobileCss).toContain("height: 82px !important");
    expect(mobileCss).toContain("height: var(--shop-card-height) !important");
    expect(mobileCss).toContain("min-height: 0 !important");
    expect(mobileCss).toContain("--shop-card-float-travel: var(--shop-card-float)");
    expect(mobileCss).toContain(".shop-window .shop-card-position .shop-card-meta-price-only .shop-price");
    expect(mobileCss).toContain("justify-content: center !important");
    expect(mobileCss).toContain(".shop-window .shop-card-position .shop-item .primary-action");
    expect(mobileCss).toContain("width: 100% !important");
    expect(mobileCss).toContain("justify-self: stretch !important");
    expect(mobileCss.lastIndexOf(
      ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .shop-window .shop-card-position .shop-item"
    )).toBeGreaterThan(mobileCss.lastIndexOf(
      ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school :is(.shop-category-character, .shop-category-item, .shop-category-decoration, .shop-category-music).shop-item"
    ));
    expect(mobileCss).toContain("bottom: -2% !important");
    expect(mobileCss).toContain("top: 57.5% !important");
    expect(mobileCss).toContain("width: min(70px, 19vw) !important");
    expect(mobileCss).toContain("height: 30% !important");
    expect(mobileCss).toContain("width: min(56px, 15vw) !important");
    expect(mobileCss).not.toContain("width: calc(100% + 32px) !important");
    expect(mobileCss).not.toContain("margin-left: -16px !important");
    expect(mobileCss).toContain("width: 44px !important");
    expect(mobileCss).not.toContain(".shop-window-body {\n    overflow: auto");
  });

  it("uses server ownership and stock fields without changing purchase semantics", () => {
    expect(isShopItemOwned({ category: "character", targetId: "denia" }, { ownedCharacters: ["denia"] })).toBe(true);
    expect(isShopItemOwned({ category: "decoration", targetId: "paw-stone" }, { ownedDecorations: ["paw-stone"] })).toBe(true);
    expect(isShopItemSoldOut({ category: "item", stockQuantity: 10, remainingStock: 0 })).toBe(true);
    expect(isShopItemSoldOut({ category: "item", stockQuantity: -1, remainingStock: -1 })).toBe(false);
  });
});

function renderCard(item, user) {
  return renderToStaticMarkup(createElement(ShopItemCard, {
    item,
    purchasingId: "",
    user,
    onBuy: () => {},
    onShowDetail: () => {}
  }));
}

function sequenceRandom(values) {
  let index = 0;
  return () => values[index++] ?? values.at(-1) ?? 0;
}

function overlap(a, b) {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

function cardSeparation(a, b) {
  const horizontal = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.width, b.x + b.width));
  const vertical = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.height, b.y + b.height));
  return Math.max(horizontal, vertical);
}

function expectTwoRowTopology(placements, firstRowCount, width) {
  const top = placements.slice(0, firstRowCount);
  const bottom = placements.slice(firstRowCount);
  expect(Math.max(...top.map((placement) => placement.y)) - Math.min(...top.map((placement) => placement.y))).toBeLessThanOrEqual(6);
  expect(Math.max(...bottom.map((placement) => placement.y)) - Math.min(...bottom.map((placement) => placement.y))).toBeLessThanOrEqual(6);
  expect(Math.min(...bottom.map((placement) => placement.y))).toBeGreaterThanOrEqual(
    Math.max(...top.map((placement) => placement.y + placement.height)) + 28
  );
  expect(Math.abs(rowCenter(top) - (width / 2))).toBeLessThanOrEqual(32);
  expect(Math.abs(rowCenter(bottom) - (width / 2))).toBeLessThanOrEqual(32);
}

function rowCenter(placements) {
  return placements.reduce((sum, placement) => sum + placement.x + (placement.width / 2), 0) / placements.length;
}

function webpInfo(path) {
  const buffer = readFileSync(new URL(path, import.meta.url));
  const losslessChunk = buffer.indexOf(Buffer.from("VP8L"));
  if (losslessChunk < 0) return { encoding: "lossy", width: 0, height: 0 };
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
