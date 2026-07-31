import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import WarehouseModal, { warehouseTargetState } from "./WarehouseModal.jsx";
import WarehouseItemGrid from "./warehouse/WarehouseItemGrid.jsx";
import WarehouseTargetModal, { warehouseCharacterTargetAvailability } from "./warehouse/WarehouseTargetModal.jsx";
import { characterItemUseNotice, itemStoryLabels } from "./warehouse/useWarehouseInventory.js";
import { readCssWithImports } from "../styles/cssTestUtils.js";

describe("WarehouseModal candy feedback", () => {
  it("renders a text-only warehouse header", () => {
    const html = renderToStaticMarkup(createElement(WarehouseModal, {
      token: "token",
      user: { ownedCharacters: [] },
      characters: {},
      onClose: () => {}
    }));

    expect(html).toContain('<header class="warehouse-header"><h2>仓库</h2></header>');
    expect(html).toContain('aria-label="关闭仓库"');
    expect(html).not.toContain("查看并使用已经购买的道具。");
    expect(html).not.toContain("lucide-package");
  });

  it("uses rejection-specific toast and skip copy without claiming the item succeeded", () => {
    expect(characterItemUseNotice("达妮娅", "彩虹豆豆跳跳糖", "rejected")).toEqual({
      message: "达妮娅拒绝了彩虹豆豆跳跳糖，道具未消耗",
      type: "danger"
    });
    expect(itemStoryLabels("彩虹豆豆跳跳糖", "rejected").skipMessage).toBe(
      "跳过只会关闭这段演出，道具没有消耗，效果也没有生效。"
    );
    expect(itemStoryLabels("彩虹豆豆跳跳糖", "accepted").skipMessage).toBe(
      "跳过只会关闭这段演出，道具效果已经生效。"
    );
  });

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

    expect(html).toContain("/assets/characters/portraits/denia-candy.webp");
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

  it("keeps mobile warehouse item cards spacious enough for enlarged artwork", () => {
    const brightSchoolMobileCss = readCssWithImports(
      new URL("../styles/themes/bright-school.css", import.meta.url)
    );
    const finalMobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));

    expect(brightSchoolMobileCss).toContain(".warehouse-item");
    expect(brightSchoolMobileCss).toContain("--warehouse-item-media-size: clamp(64px, 20vw, 72px)");
    expect(brightSchoolMobileCss).toContain("min-height: 120px !important");
    expect(brightSchoolMobileCss).toContain("padding: 11px !important");
    expect(brightSchoolMobileCss).toContain("font-size: 14px !important");
    expect(brightSchoolMobileCss).toContain("font-size: 12px !important");
    expect(finalMobileCss).toContain(".warehouse-item");
    expect(finalMobileCss).toContain("--warehouse-item-media-size: clamp(64px, 20vw, 72px)");
    expect(finalMobileCss).toContain("min-height: 120px !important");
    expect(finalMobileCss).toContain("padding: 11px !important");
    expect(finalMobileCss).not.toContain(".warehouse-item:active");
  });

  it("lays out desktop warehouse items as a two-column collection with mobile fallback", () => {
    const commerceCss = readCssWithImports(new URL("../styles/commerce-settings.css", import.meta.url));
    const brightSchoolCss = readCssWithImports(new URL("../styles/themes/bright-school.css", import.meta.url));
    const finalMobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));
    const gridBlock = [...commerceCss.matchAll(/\.warehouse-grid\s*\{[^}]+\}/g)]
      .map((match) => match[0])
      .find((block) => block.includes("scroll-padding: 0 6px 6px 0")) ?? "";
    const itemBlock = [...commerceCss.matchAll(/\.warehouse-item\s*\{[^}]+\}/g)]
      .map((match) => match[0])
      .find((block) => block.includes("--warehouse-item-media-size: 80px")) ?? "";
    const actionBlock = [...commerceCss.matchAll(/\.warehouse-item \.primary-action\s*\{[^}]+\}/g)]
      .map((match) => match[0])
      .find((block) => block.includes("align-self: end")) ?? "";

    expect(commerceCss).toContain("width: min(900px");
    expect(gridBlock).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(gridBlock).toContain("padding-right: 6px");
    expect(gridBlock).toContain("padding-bottom: 6px");
    expect(gridBlock).toContain("scroll-padding: 0 6px 6px 0");
    expect(itemBlock).toContain("grid-template-columns: var(--warehouse-item-media-size) minmax(0, 1fr)");
    expect(itemBlock).toContain("align-items: stretch");
    expect(actionBlock).toContain("grid-column: 2");
    expect(actionBlock).toContain("grid-row: 2");
    expect(actionBlock).toContain("align-self: end");
    expect(brightSchoolCss).toContain("--warehouse-item-media-size: 104px");
    expect(brightSchoolCss).toContain(".warehouse-item-media");
    expect(brightSchoolCss).toContain("object-fit: contain !important");
    expect(finalMobileCss).toContain(".warehouse-item");
    expect(finalMobileCss).toContain(".warehouse-grid");
    expect(finalMobileCss).toContain("padding-right: 6px !important");
    expect(finalMobileCss).toContain("padding-bottom: 6px !important");
    expect(finalMobileCss).toContain("scroll-padding: 0 6px 6px 0 !important");
    expect(finalMobileCss).toContain("grid-template-columns: var(--warehouse-item-media-size) minmax(0, 1fr) !important");
    expect(finalMobileCss).toContain(".warehouse-item-media");
    expect(finalMobileCss).toContain(".warehouse-item-quantity");
  });

  it("renders unusable item actions as disabled gray buttons on desktop and mobile", () => {
    const html = renderToStaticMarkup(createElement(WarehouseItemGrid, {
      items: [{
        itemId: "recruitment-poster",
        name: "招新贴报",
        description: "可以招募学院内的人",
        quantity: 2,
        targetType: "recruitment",
        usable: false
      }],
      usingItemId: "",
      onSelectTargetItem: () => {},
      onUseItem: () => {}
    }));
    const commerceCss = readCssWithImports(new URL("../styles/commerce-settings.css", import.meta.url));
    const finalMobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));
    const brightSchoolCss = readCssWithImports(new URL("../styles/themes/bright-school.css", import.meta.url));
    const disabledBlock = commerceCss.match(/\.warehouse-item \.primary-action:disabled\s*\{[^}]+\}/)?.[0] ?? "";

    expect(html).toContain('class="primary-action"');
    expect(html).toContain('class="warehouse-item-media"');
    expect(html).toContain('class="warehouse-item-copy"');
    expect(html).toContain('class="warehouse-item-quantity"');
    expect(html).toContain("×2");
    expect(html).toContain('aria-label="数量 2"');
    expect(html).toContain('aria-label="请去招募：招新贴报"');
    expect(html).toContain("disabled=\"\"");
    expect(html).toContain("请去招募");
    expect(disabledBlock).toContain("cursor: not-allowed");
    expect(disabledBlock).toContain("grayscale");
    expect(finalMobileCss).toContain(".primary-action:active:not(:disabled)");
    expect(brightSchoolCss).toContain(".warehouse-item .primary-action:disabled");
    expect(brightSchoolCss).toContain("background: #d8d4cc !important");
    expect(brightSchoolCss).toContain("cursor: not-allowed !important");
  });

  it("disables character targets that are already affected or have no item effect", () => {
    const item = { itemId: "rainbow-bean-candy", name: "彩虹豆豆跳跳糖", targetType: "character" };
    const characters = {
      denia: { id: "denia", name: "达妮娅", portrait: "/assets/Danea_centered.webp" },
      sigrika: { id: "sigrika", name: "西格莉卡", portrait: "/assets/sigrika_centered.webp" },
      aemeath: { id: "aemeath", name: "爱弥斯", portrait: "/assets/aemeath_centered.webp" },
      lynae: { id: "lynae", name: "琳奈", portrait: "/assets/lynae.png" },
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
    expect(warehouseCharacterTargetAvailability({
      character: characters.aemeath,
      item,
      itemEffects: {}
    })).toEqual({ disabled: false, reason: "" });
    expect(warehouseCharacterTargetAvailability({
      character: characters.lynae,
      item,
      itemEffects: {}
    })).toEqual({ disabled: false, reason: "" });
    expect(warehouseCharacterTargetAvailability({
      character: characters.lynae,
      item,
      itemEffects: { lynaeContraryVoice: true }
    })).toEqual({ disabled: true, reason: "效果中" });

    const html = renderToStaticMarkup(createElement(WarehouseTargetModal, {
      characters,
      ownedCharacters: [characters.denia, characters.sigrika, characters.lynae, characters.momo],
      targetItem: item,
      targetResult: null,
      user: { itemEffects: { deniaRainbowGlow: true } },
      onClose: () => {},
      onUseItem: () => {}
    }));

    expect(html.match(/warehouse-target-disabled/g)).toHaveLength(2);
    expect(html.match(/disabled=""/g)).toHaveLength(2);
    expect(html).toContain("琳奈</span>");
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
