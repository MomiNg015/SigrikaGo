import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import AdminGachaPools, { prizeOptionsForType } from "./AdminGachaPools.jsx";
import { ADMIN_TABS, ADMIN_TAB_LABELS } from "./AdminShell.jsx";
import {
  buildGachaPoolDraft,
  gachaPoolDraftToBody,
  emptyGachaPoolDraft
} from "../shared/adminDrafts.js";

describe("AdminGachaPools", () => {
  it("adds a dedicated admin tab for gacha management", () => {
    expect(ADMIN_TABS).toContain("gacha");
    expect(ADMIN_TAB_LABELS.gacha).toBeTruthy();
  });

  it("renders pool price, time, featured prize, and probability management fields", () => {
    const html = renderToStaticMarkup(createElement(AdminGachaPools, {
      pools: [{
        id: "pool-1",
        name: "Summer Capsules",
        enabled: true,
        permanent: false,
        openDateRange: "2026/06/12-2026/06/30",
        singleDrawPrice: 60,
        tenDrawPrice: 560,
        featuredPrizeId: "prize-1",
        featuredPrize: { imageUrl: "/assets/Danea_centered.webp", name: "Danea" },
        prizes: [{ id: "prize-1", type: "character", targetId: "danea", quantity: 1, probabilityBasisPoints: 10000, enabled: true }]
      }],
      token: "token",
      onSaved: () => {},
      onNotice: () => {}
    }));

    expect(html).toContain("admin-gacha-board");
    expect(html).toContain("admin-gacha-prize-list");
    expect(html).toContain("60 / 560");
    expect(html).toContain("2026/06/12-2026/06/30");
  });

  it("uses selectable game resources instead of free-form prize id and name fields", () => {
    const source = readFileSync(new URL("./AdminGachaPools.jsx", import.meta.url), "utf8");

    expect(source).toContain("admin-gacha-resource-select");
    expect(source).toContain("admin-gacha-prize-resource");
    expect(source).toContain("admin-gacha-prize-thumb");
    expect(source).toContain("admin-gacha-featured-toggle");
    expect(source).toContain("resourceCatalogs");
    expect(source).toContain("prizeOptionsForType");
    expect(source).not.toContain('placeholder="资源ID"');
    expect(source).not.toContain('placeholder="名称"');
  });

  it("builds valid API payloads with configurable prices and featured prize index", () => {
    const draft = buildGachaPoolDraft({
      ...emptyGachaPoolDraft(),
      name: "Prize Board",
      singleDrawPrice: "50",
      tenDrawPrice: "500",
      prizes: [
        { type: "coins", targetId: "", quantity: "60", probabilityBasisPoints: "10000", enabled: true, name: "Coins" }
      ]
    });

    const body = gachaPoolDraftToBody(draft);

    expect(body.singleDrawPrice).toBe(50);
    expect(body.tenDrawPrice).toBe(500);
    expect(body.featuredPrizeIndex).toBe(0);
    expect(body.prizes[0]).toMatchObject({ type: "coins", quantity: 60, probabilityBasisPoints: 10000 });
  });

  it("keeps gacha admin styles separate from shop cards", () => {
    const source = readFileSync(new URL("../styles/admin.css", import.meta.url), "utf8");

    expect(source).toContain(".admin-gacha-board");
    expect(source).toContain(".admin-gacha-prize-row");
    expect(source).toContain(".admin-gacha-prize-editor-head");
    expect(source).toContain(".admin-gacha-prize-thumb");
    expect(source).toContain(".admin-gacha-featured-toggle");
  });

  it("keeps the gacha editor drawer wide and internally responsive", () => {
    const source = readFileSync(new URL("../styles/admin.css", import.meta.url), "utf8");

    expect(source).toContain(".admin-gacha-board .admin-crud-drawer");
    expect(source).toContain("width: min(1040px, calc(100vw - 32px))");
    expect(source).toContain("@media (max-width: 860px)");
    expect(source).toContain(".admin-gacha-prize-row");
    expect(source).toContain("grid-template-columns: minmax(340px, 1.45fr) minmax(260px, 1fr) 92px 70px");
    expect(source).toContain("grid-template-columns: 1fr");
  });

  it("includes built-in stone decorations in decoration prize options", () => {
    const options = prizeOptionsForType("decoration", {
      decorations: [{ slug: "codex-deco", name: "Codex Deco", imageUrl: "/codex.webp" }]
    });

    expect(options.map((option) => option.value)).toEqual(expect.arrayContaining([
      "paw-stone",
      "papagan-peach-stone",
      "codex-deco"
    ]));
  });

  it("labels gacha prize number fields with units", () => {
    const source = readFileSync(new URL("./AdminGachaPools.jsx", import.meta.url), "utf8");

    expect(source).toContain("admin-gacha-number-field");
    expect(source).toContain("数量");
    expect(source).toContain("概率");
    expect(source).toContain("/10000");
  });
});
