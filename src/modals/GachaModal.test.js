import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import GachaModal, { GachaResultDialog } from "./GachaModal.jsx";
import {
  GACHA_COIN_BAG_IMAGE,
  buildGachaRewardDisplay,
  buildGachaRewardLabel,
  formatGachaDateRange,
  formatGachaRemaining,
  selectInitialGachaPool
} from "./gacha/gachaHelpers.js";

describe("GachaModal", () => {
  const pools = [{
    id: "summer",
    name: "Summer Capsules",
    openDateRange: "2026/06/12-2026/06/30",
    remainingMs: 3600000,
    singleDrawPrice: 60,
    tenDrawPrice: 560,
    featuredPrize: { name: "Danea", imageUrl: "/assets/Danea_centered.webp" },
    prizes: [
      { id: "p1", type: "character", targetId: "danea", quantity: 1, probabilityPercent: 70, name: "Danea", imageUrl: "/assets/Danea_centered.webp" },
      { id: "p2", type: "coins", targetId: "", quantity: 60, probabilityPercent: 30, name: "Coins", imageUrl: "" }
    ]
  }];

  it("renders pool tabs, featured prize, wallet, draw buttons, and round utility buttons", () => {
    const html = renderToStaticMarkup(createElement(GachaModal, {
      token: "token",
      user: { coins: 900, blueGems: 2 },
      initialPools: pools,
      onUserChange: () => {},
      onNotice: () => {},
      onClose: () => {}
    }));

    expect(html).toContain("gacha-modal");
    expect(html).toContain("gacha-festival-scheme");
    expect(html).toContain("gacha-pool-tabs");
    expect(html).toContain("gacha-featured-stage");
    expect(html).toContain("gacha-festival-marquee");
    expect(html).toContain("gacha-wallet");
    expect(html).toContain("gacha-round-button");
    expect(html).toContain("gacha-draw-actions");
    expect(html).toContain("gacha-machine");
    expect(html).toContain("gacha-capsule");
    expect(html).toContain("扭蛋祭");
    expect(html).toContain("本期大奖");
  });

  it("renders multiple featured prizes as a stacked prize group", () => {
    const html = renderToStaticMarkup(createElement(GachaModal, {
      token: "token",
      user: { coins: 900, blueGems: 2 },
      initialPools: [{
        ...pools[0],
        featuredPrize: { name: "Danea", imageUrl: "/assets/Danea_centered.webp" },
        featuredPrizes: [
          { id: "p1", name: "Danea", imageUrl: "/assets/Danea_centered.webp" },
          { id: "p2", name: "Coins", imageUrl: "/assets/items/rainbow-bean-candy.webp" }
        ]
      }],
      onUserChange: () => {},
      onNotice: () => {},
      onClose: () => {}
    }));

    expect(html).toContain("gacha-featured-stack");
    expect(html).toContain("Danea、Coins");
  });

  it("keeps gacha helpers deterministic and readable", () => {
    expect(selectInitialGachaPool(pools)?.id).toBe("summer");
    expect(formatGachaDateRange({ permanent: true })).toBe("permanent");
    expect(formatGachaDateRange({ startsAt: "2026-06-12T00:00:00Z", endsAt: "2026-06-30T00:00:00Z" })).toBe("2026/06/12-2026/06/30");
    expect(formatGachaRemaining(3600000)).toContain("1h");
    expect(buildGachaRewardLabel({ type: "coins", quantity: 60 })).toContain("60");
    expect(buildGachaRewardLabel({ type: "character", targetId: "danea", chainAdded: 1 })).toContain("+1");
  });

  it("builds player-facing reward display metadata", () => {
    expect(buildGachaRewardDisplay({ type: "coins", quantity: 40 })).toMatchObject({
      name: "金币",
      detail: "40 金币",
      imageUrl: GACHA_COIN_BAG_IMAGE
    });
    expect(buildGachaRewardDisplay({
      type: "item",
      targetId: "rainbow-bean-candy",
      name: "彩虹豆豆跳跳糖",
      quantity: 3,
      imageUrl: "/assets/items/rainbow-bean-candy.webp"
    })).toMatchObject({
      name: "彩虹豆豆跳跳糖",
      detail: "x3",
      imageUrl: "/assets/items/rainbow-bean-candy.webp"
    });
  });

  it("renders ten-pull results as visual reward cards with names and details", () => {
    const rewards = [
      { prizeId: "coin-1", type: "coins", quantity: 40 },
      { prizeId: "item-1", type: "item", targetId: "rainbow-bean-candy", name: "彩虹豆豆跳跳糖", quantity: 3, imageUrl: "/assets/items/rainbow-bean-candy.webp" },
      { prizeId: "character-1", type: "character", targetId: "nabomo", name: "娜波摩", quantity: 1, imageUrl: "/assets/nabomo.webp" },
      { prizeId: "coin-2", type: "coins", quantity: 60 },
      { prizeId: "item-2", type: "item", name: "彩虹豆豆跳跳糖", quantity: 3, imageUrl: "/assets/items/rainbow-bean-candy.webp" },
      { prizeId: "coin-3", type: "coins", quantity: 40 },
      { prizeId: "coin-4", type: "coins", quantity: 40 },
      { prizeId: "coin-5", type: "coins", quantity: 40 },
      { prizeId: "coin-6", type: "coins", quantity: 40 },
      { prizeId: "coin-7", type: "coins", quantity: 40 }
    ];

    const html = renderToStaticMarkup(createElement(GachaResultDialog, {
      result: { rewards },
      onClose: () => {}
    }));

    expect(html).toContain("gacha-result-grid ten-pull");
    expect(html).toContain("gacha-result-image");
    expect(html).toContain(GACHA_COIN_BAG_IMAGE);
    expect(html).toContain("彩虹豆豆跳跳糖");
    expect(html).toContain("娜波摩");
    expect(html).toContain("x3");
    expect(html).not.toContain("rainbow-bean-candy x3");
  });

  it("defines the scheme C festival capsule machine animation hooks", () => {
    const css = readFileSync(new URL("../styles/commerce-settings.css", import.meta.url), "utf8");
    const brightSchoolCss = readFileSync(new URL("../styles/themes/bright-school/commerce.css", import.meta.url), "utf8");

    expect(css).toContain(".gacha-modal.gacha-festival-scheme");
    expect(css).toContain(".gacha-modal.gacha-festival-scheme > :not(.close-button)");
    expect(css).toContain(".gacha-festival-marquee");
    expect(css).toContain("@keyframes gacha-capsule-roll");
    expect(css).toContain("@keyframes gacha-drum-spin");
    expect(css).toContain(".gacha-result-card");
    expect(css).toContain(".gacha-result-grid.ten-pull");
    expect(css).toContain("grid-template-columns: repeat(5, minmax(0, 1fr))");
    expect(css).toContain("@media screen and (max-width: 768px)");
    expect(css).toContain("grid-auto-flow: column");
    expect(css).toContain("position: sticky");
    expect(css).toContain(".gacha-result-image img");
    expect(css).toContain(".gacha-featured-stack");
    const closeButtonBlock = css.slice(
      css.indexOf(".gacha-modal.gacha-festival-scheme .close-button"),
      css.indexOf(".gacha-festival-scheme .gacha-pool-tabs")
    );
    expect(closeButtonBlock).toContain("position: absolute");
    expect(brightSchoolCss).toContain("Bright School gacha machine polish layer.");
    expect(brightSchoolCss).toContain(".gacha-ticket-tab");
  });
});
