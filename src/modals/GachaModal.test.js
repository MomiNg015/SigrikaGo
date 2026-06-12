import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import GachaModal from "./GachaModal.jsx";
import {
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
    expect(html).toContain("gacha-pool-tabs");
    expect(html).toContain("gacha-featured-stage");
    expect(html).toContain("gacha-wallet");
    expect(html).toContain("gacha-round-button");
    expect(html).toContain("gacha-draw-actions");
    expect(html).toContain("gacha-machine");
    expect(html).toContain("gacha-capsule");
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

  it("defines the school-club capsule machine animation hooks", () => {
    const css = readFileSync(new URL("../styles/commerce-settings.css", import.meta.url), "utf8");
    const brightSchoolCss = readFileSync(new URL("../styles/themes/bright-school/commerce.css", import.meta.url), "utf8");

    expect(css).toContain("@keyframes gacha-capsule-roll");
    expect(css).toContain("@keyframes gacha-drum-spin");
    expect(css).toContain(".gacha-result-card");
    expect(css).toContain(".gacha-featured-stack");
    expect(brightSchoolCss).toContain("Bright School gacha machine polish layer.");
    expect(brightSchoolCss).toContain(".gacha-ticket-tab");
  });
});
