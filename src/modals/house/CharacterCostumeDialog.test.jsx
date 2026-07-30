import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import CharacterCostumeDialog, { orderCostumeCards } from "./CharacterCostumeDialog.jsx";

const character = {
  id: "denia",
  name: "达妮娅",
  portrait: "/assets/characters/denia.webp",
  illustName: "绘师",
  illustUrl: "https://example.com/illustrator"
};

const costumes = [
  {
    id: "denia-costume-unowned",
    name: "未拥有",
    characterSlug: "denia",
    portraitUrl: "/assets/costumes/denia-02.webp",
    owned: false,
    enabled: true,
    sortOrder: 1
  },
  {
    id: "denia-costume-equipped",
    name: "当前服装",
    characterSlug: "denia",
    portraitUrl: "/assets/costumes/denia-01.webp",
    portraitScalePercent: 88,
    portraitOffsetXPercent: -2,
    portraitOffsetYPercent: 3,
    owned: true,
    enabled: true,
    sortOrder: 10
  },
  {
    id: "denia-costume-owned",
    name: "已拥有",
    characterSlug: "denia",
    portraitUrl: "/assets/costumes/denia-03.webp",
    owned: true,
    enabled: true,
    sortOrder: 0
  }
];

describe("CharacterCostumeDialog", () => {
  it("orders default, current, other owned, then unowned costumes", () => {
    const ordered = orderCostumeCards(character, costumes, {
      ownedCostumeIds: ["denia-costume-equipped", "denia-costume-owned"],
      equippedCostumes: {
        denia: { id: "denia-costume-equipped" }
      }
    });
    expect(ordered.map((costume) => costume.id)).toEqual([
      "default",
      "denia-costume-equipped",
      "denia-costume-owned",
      "denia-costume-unowned"
    ]);
    expect(ordered[0]).toMatchObject({
      illustName: "绘师",
      illustUrl: "https://example.com/illustrator"
    });
  });

  it("keeps unowned cards inspectable while disabling only their outfit button", () => {
    const html = renderToStaticMarkup(createElement(CharacterCostumeDialog, {
      character,
      characterOwned: true,
      costumes,
      loading: false,
      equippingId: "",
      user: {
        ownedCostumeIds: ["denia-costume-equipped", "denia-costume-owned"],
        equippedCostumes: { denia: { id: "denia-costume-equipped" } }
      },
      onEquip: vi.fn(),
      onClose: vi.fn()
    }));

    expect(html).toContain("character-costume-card is-unowned");
    expect(html).toContain('aria-label="装扮未拥有" disabled=""');
    expect(html).toContain('aria-label="装扮默认服装"');
    expect(html).toContain('aria-current="true"');
    expect(html).toContain("达妮娅的衣柜");
    expect(html).toContain("scale:0.88");
    expect(html).toContain("translate:-2% 3%");
    expect(html).not.toContain("character-costume-equipped-label");
    expect(html).not.toContain('character-costume-card is-unowned is-equipped');
    expect(html).not.toContain("部员手册 · 服装");
    expect(html).not.toContain("这个角色暂时只有默认服装");
  });

  it("uses a top-level portal and mobile wardrobe layout without visible equipped copy", () => {
    const source = readFileSync(new URL("./CharacterCostumeDialog.jsx", import.meta.url), "utf8");
    const css = readFileSync(
      new URL("../../styles/modals/character-opening/costume-wardrobe.css", import.meta.url),
      "utf8"
    );
    const mobileCss = readFileSync(
      new URL("../../styles/modals/character-opening/costume-wardrobe-mobile.css", import.meta.url),
      "utf8"
    );
    const themeCss = readFileSync(
      new URL("../../styles/themes/bright-school/modals/handbook-decoration.css", import.meta.url),
      "utf8"
    );

    expect(source).toContain('setPortalTarget(document.querySelector(".app-shell") ?? document.body)');
    expect(source).toContain("createPortal(dialogs, portalTarget)");
    expect(source).toContain('className="modal-backdrop character-costume-backdrop"');
    expect(source).toContain('className="nested-modal-backdrop shop-detail-backdrop character-costume-detail-backdrop"');
    expect(source).toContain('className="nested-modal shop-item-detail-modal character-costume-detail"');
    expect(source).toContain('className="shop-detail-art character-costume-detail-art"');
    expect(source).toContain('className="shop-detail-copy character-costume-detail-copy"');
    expect(source).not.toContain("shop-detail-stats");
    expect(source).not.toContain("持有状态");
    expect(source).not.toContain("装扮中</span>");
    expect(css).toContain("background: #ddf7df;");
    expect(css).toContain(".nested-modal-backdrop.character-costume-detail-backdrop");
    expect(css).toContain("z-index: 162;");
    expect(themeCss).toContain(".character-costume-card .character-costume-detail-trigger:active");
    expect(themeCss).toContain("background: transparent !important;");
    expect(themeCss).toContain(".character-costume-card.is-equipped");
    expect(mobileCss).toContain("left: 8px !important;");
    expect(mobileCss).toContain("grid-template-rows: minmax(0, 1fr) auto !important;");
    expect(mobileCss).toContain("justify-self: center !important;");
    expect(mobileCss).toContain("position: static !important;");
    expect(mobileCss).not.toContain(".character-costume-detail {");
  });
});
