import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import WarehouseModal, { warehouseTargetState } from "./WarehouseModal.jsx";
import WarehouseTargetModal, { warehouseCharacterTargetAvailability } from "./warehouse/WarehouseTargetModal.jsx";
import { readCssWithImports } from "../styles/cssTestUtils.js";

describe("WarehouseModal candy feedback", () => {
  it("keeps the used character centered with the effect text after item use", () => {
    const targetState = {
      item: { itemId: "rainbow-bean-candy", name: "彩虹豆豆跳跳糖" },
      characterId: "sigrika",
      effectText: "西格莉卡吃下了糖果，一直在打嗝。"
    };
    const html = renderToStaticMarkup(createElement(WarehouseModal, {
      token: "token",
      user: { ownedCharacters: ["sigrika", "denia"] },
      characters: {
        sigrika: { id: "sigrika", name: "西格莉卡", portrait: "/assets/sigrika_centered.webp" },
        denia: { id: "denia", name: "达妮娅", portrait: "/assets/Danea_centered.webp" }
      },
      initialTargetState: targetState,
      onUserChange: () => {},
      onClose: () => {}
    }));

    expect(warehouseTargetState(targetState).isResolved).toBe(true);
    expect(html).toContain("warehouse-effect-result");
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain("西格莉卡吃下了糖果");
    expect(html).toContain("西格莉卡");
    expect(html).not.toContain("达妮娅</span>");
  });

  it("does not render inline success or error notices in the warehouse shell", () => {
    const html = renderToStaticMarkup(createElement(WarehouseModal, {
      token: "token",
      user: { ownedCharacters: [] },
      characters: {},
      initialMessage: "已使用",
      initialError: "失败了",
      onUserChange: () => {},
      onNotice: () => {},
      onClose: () => {}
    }));

    expect(html).not.toContain("admin-success");
    expect(html).not.toContain("admin-action-error");
    expect(html).not.toContain("已使用");
    expect(html).not.toContain("失败了");
  });

  it("renders the already-applied candy portrait in the item effect result", () => {
    const html = renderToStaticMarkup(createElement(WarehouseModal, {
      token: "token",
      user: { ownedCharacters: ["denia"], itemEffects: { deniaRainbowGlow: true } },
      characters: {
        denia: { id: "denia", name: "达妮娅", portrait: "/assets/Danea_centered.webp" }
      },
      initialTargetState: {
        item: { itemId: "rainbow-bean-candy", name: "彩虹豆豆跳跳糖" },
        characterId: "denia",
        effectText: "达妮娅吃下了糖果。",
        itemEffects: { deniaRainbowGlow: true }
      },
      onUserChange: () => {},
      onNotice: () => {},
      onClose: () => {}
    }));

    expect(html).toContain("/assets/characters/denia_color.webp");
    expect(html).not.toContain("/assets/Danea_centered.webp");
  });

  it("adds terminal item category hooks for inventory card glow styling", () => {
    const html = renderToStaticMarkup(createElement(WarehouseModal, {
      token: "token",
      user: { ownedCharacters: ["sigrika"] },
      characters: {
        sigrika: { id: "sigrika", name: "西格莉卡", portrait: "/assets/sigrika_centered.webp" }
      },
      initialTargetState: {
        item: { itemId: "rainbow-bean-candy", name: "彩虹豆豆跳跳糖", targetType: "character" },
        characterId: "sigrika",
        effectText: "糖果效果已同步。",
        itemEffects: {}
      },
      onUserChange: () => {},
      onNotice: () => {},
      onClose: () => {}
    }));

    expect(html).toContain("warehouse-effect-result");
    expect(html).toContain("warehouse-item-category-character");
  });

  it("keeps mobile warehouse item cards tall enough for item details", () => {
    const brightSchoolMobileCss = readCssWithImports(
      new URL("../styles/themes/bright-school/mobile.css", import.meta.url)
    );
    const finalMobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));

    expect(brightSchoolMobileCss).toContain(".warehouse-item");
    expect(brightSchoolMobileCss).toContain("min-height: 88px !important");
    expect(brightSchoolMobileCss).toContain("padding: 10px 10px !important");
    expect(finalMobileCss).toContain(".warehouse-item");
    expect(finalMobileCss).toContain("min-height: 88px !important");
    expect(finalMobileCss).toContain("padding: 10px 10px !important");
  });

  it("lays out desktop warehouse items as single-row entries while preserving mobile overrides", () => {
    const commerceCss = readCssWithImports(new URL("../styles/commerce-settings.css", import.meta.url));
    const finalMobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));
    const gridBlock = commerceCss.match(/\.warehouse-grid\s*\{[^}]+\}/)?.[0] ?? "";
    const itemBlock = [...commerceCss.matchAll(/\.warehouse-item\s*\{[^}]+\}/g)]
      .map((match) => match[0])
      .find((block) => block.includes("64px minmax(0, 1fr) auto")) ?? "";
    const actionBlock = [...commerceCss.matchAll(/\.warehouse-item \.primary-action\s*\{[^}]+\}/g)]
      .map((match) => match[0])
      .find((block) => block.includes("align-self: center")) ?? "";

    expect(gridBlock).toContain("grid-template-columns: 1fr");
    expect(itemBlock).toContain("grid-template-columns: 64px minmax(0, 1fr) auto");
    expect(itemBlock).toContain("align-items: center");
    expect(actionBlock).not.toContain("grid-column: 1 / -1");
    expect(actionBlock).toContain("align-self: center");
    expect(finalMobileCss).toContain(".warehouse-item");
    expect(finalMobileCss).toContain("grid-template-columns: 36px minmax(0, 1fr) auto auto !important");
  });

  it("disables character targets that are already affected or have no item effect", () => {
    const item = { itemId: "rainbow-bean-candy", name: "彩虹豆豆跳跳糖", targetType: "character" };
    const characters = {
      denia: { id: "denia", name: "达妮娅", portrait: "/assets/Danea_centered.webp" },
      sigrika: { id: "sigrika", name: "西格莉卡", portrait: "/assets/sigrika_centered.webp" },
      momo: { id: "momo", name: "莫名", portrait: "/assets/momo.webp" }
    };

    expect(warehouseCharacterTargetAvailability({
      character: characters.denia,
      item,
      itemEffects: { deniaRainbowGlow: true }
    })).toEqual({ disabled: true, reason: "效果中" });
    expect(warehouseCharacterTargetAvailability({
      character: characters.momo,
      item,
      itemEffects: {}
    })).toEqual({ disabled: true, reason: "无效果" });
    expect(warehouseCharacterTargetAvailability({
      character: characters.sigrika,
      item,
      itemEffects: {}
    })).toEqual({ disabled: false, reason: "" });

    const html = renderToStaticMarkup(createElement(WarehouseTargetModal, {
      characters,
      ownedCharacters: [characters.denia, characters.sigrika, characters.momo],
      targetItem: item,
      targetResult: null,
      user: { itemEffects: { deniaRainbowGlow: true } },
      onClose: () => {},
      onUseItem: () => {}
    }));

    expect(html.match(/warehouse-target-disabled/g)).toHaveLength(2);
    expect(html.match(/disabled=""/g)).toHaveLength(2);
    expect(html).not.toContain("<small");
    expect(html).not.toContain("title=\"效果中");
    expect(html).not.toContain("title=\"无效果");

    const brightSchoolMobileCss = readCssWithImports(
      new URL("../styles/themes/bright-school/mobile.css", import.meta.url)
    );
    const brightSchoolComponentCss = readCssWithImports(
      new URL("../styles/themes/bright-school/component-repairs.css", import.meta.url)
    );
    expect(brightSchoolMobileCss).not.toContain(".warehouse-character-grid small");
    expect(brightSchoolComponentCss).not.toContain(".warehouse-character-grid button.warehouse-target-disabled small");
  });
});
