import React from "react";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import PersonalizationModal from "./PersonalizationModal.jsx";
import { readCssWithImports } from "../styles/cssTestUtils.js";

describe("PersonalizationModal", () => {
  it("renders try-on sections as style picker entry points", () => {
    const html = renderToStaticMarkup(
      <PersonalizationModal
        token="token"
        user={{
          username: "moming",
          achievementEquipment: {
            titleAssetId: "",
            badgeAssetId: "",
            nameplateAssetId: "reward-sigrika-spark-100-wins-nameplate"
          },
          achievementEquipmentAssets: {
            title: null,
            badge: null,
            nameplate: {
              id: "reward-sigrika-spark-100-wins-nameplate",
              type: "nameplate",
              name: "点亮语义！",
              imageUrl: "/assets/achievements/semantic-nameplate.png"
            }
          }
        }}
        onClose={vi.fn()}
        onNotice={vi.fn()}
      />
    );
    const source = readFileSync(new URL("./PersonalizationModal.jsx", import.meta.url), "utf8");
    const css = readCssWithImports(new URL("../styles/modals.css", import.meta.url));
    const mobileCss = readCssWithImports(new URL("../styles/mobile-modals.css", import.meta.url));
    const brightSchoolCss = readCssWithImports(new URL("../styles/themes/bright-school/modals.css", import.meta.url));

    expect(html).toContain('aria-label="个性化试穿预览"');
    expect(html).toContain("user-identity has-nameplate");
    expect(html).toContain("background-image:url(/assets/achievements/semantic-nameplate.png)");
    expect(html).toContain("样式选择");
    expect(html).toContain("默认");
    expect(html).toContain(">保存</button>");
    expect(html).not.toContain("保存装备");
    expect(source).toContain("pickerType");
    expect(source).toContain("chooseOption");
    expect(source).toContain("setPickerType(\"\")");
    expect(source).toContain("personalization-picker-modal");
    expect(source).toContain("选择{pickerSection.label}");
    expect(css).toContain(".personalization-section-summary");
    expect(css).toContain(".personalization-style-trigger");
    expect(css).toContain(".personalization-picker-backdrop");
    expect(css).toContain(".personalization-picker-modal");
    expect(css).toContain(".personalization-picker-list");
    expect(css).toContain("grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));");
    expect(css).toContain(".personalization-picker-modal .personalization-picker-header .close-button");
    expect(css).toContain("position: static;");
    expect(css).toContain(".personalization-picker-list button.equipped");
    expect(css).toContain("background: #ff9ebb;");
    expect(css).toContain(".personalization-picker-list button.trying");
    expect(css).toContain("background: #ecfff6;");
    expect(mobileCss).toContain(".personalization-picker-list");
    expect(mobileCss).toContain("grid-template-columns: 1fr;");
    expect(mobileCss).toContain(".personalization-picker-modal");
    expect(mobileCss).toContain("max-height: calc(100dvh - 56px);");
    expect(brightSchoolCss).toContain(".personalization-picker-list button.equipped");
    expect(brightSchoolCss).toContain("background: #ff9ebb !important");
    expect(brightSchoolCss).toContain(".personalization-picker-list button.trying");
    expect(brightSchoolCss).toContain("background: #ecfff6 !important");
    expect(brightSchoolCss).toContain(".personalization-picker-modal .personalization-picker-header .close-button");
    expect(brightSchoolCss).toContain("position: static !important");
  });
});
