import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import WarehouseModal, { warehouseTargetState } from "./WarehouseModal.jsx";

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
        sigrika: { id: "sigrika", name: "西格莉卡", portrait: "/assets/sigrika_centered.png" },
        denia: { id: "denia", name: "达妮娅", portrait: "/assets/Danea_centered.png" }
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
        denia: { id: "denia", name: "达妮娅", portrait: "/assets/Danea_centered.png" }
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

    expect(html).toContain("/assets/characters/denia_color.gif");
    expect(html).not.toContain("/assets/Danea_centered.png");
  });
});
