import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import SettingsModal from "./SettingsModal.jsx";
import { readCssWithImports } from "../styles/cssTestUtils.js";

describe("SettingsModal terminal style hooks", () => {
  it("renders settings and audio rows with contrast-fix class hooks", () => {
    const html = renderToStaticMarkup(createElement(SettingsModal, {
      audioSettings: { master: 100, bgm: 80, sfx: 70, voice: 60 },
      setAudioSettings: () => {},
      onClose: () => {}
    }));

    expect(html).toContain("settings-modal settings-modal-content");
    expect(html).toContain("settings-panel settings-modal-content");
    expect(html).toContain("volume-row audio-slider-item");
    expect(html).toContain("audio-volume-title");
    expect(html).toContain("type=\"range\"");
  });

  it("marks muted audio rows without moving slider values", () => {
    const html = renderToStaticMarkup(createElement(SettingsModal, {
      audioSettings: { master: 100, bgm: 80, sfx: 70, voice: 60, muted: { bgm: true } },
      setAudioSettings: () => {},
      onClose: () => {}
    }));

    expect(html).toContain("volume-row audio-slider-item is-muted");
    expect(html).toContain("aria-pressed=\"true\"");
    expect(html).toContain("value=\"80\"");
  });

  it("keeps mute toggle and slider unmute behavior in the audio handlers", () => {
    const source = readFileSync(new URL("./SettingsModal.jsx", import.meta.url), "utf8");

    expect(source).toContain("settings.muted?.[item.key] === true");
    expect(source).toContain("[item.key]: !(settings.muted?.[item.key] === true)");
    expect(source).toContain("[item.key]: false");
    expect(source).toContain("aria-labelledby={labelId}");
  });

  it("keeps audio title buttons visually text-only despite global button skins", () => {
    const baseCss = readFileSync(new URL("../styles/commerce/shop-settings/settings-panel.css", import.meta.url), "utf8");
    const brightSchoolCss = readCssWithImports(new URL("../styles/themes/bright-school/modals.css", import.meta.url));
    const mobileSafetyCss = readCssWithImports(new URL("../styles/mobile-adaptive/bright-school-portrait.css", import.meta.url));

    for (const css of [baseCss, brightSchoolCss, mobileSafetyCss]) {
      expect(css).toContain(".volume-row > button.audio-volume-title:hover");
      expect(css).toContain(".volume-row > button.audio-volume-title:active");
      expect(css).toContain("border: 0 !important");
      expect(css).toContain("box-shadow: none !important");
      expect(css).toContain("transform: none !important");
      expect(css).toContain("background: transparent !important");
      expect(css).toContain(".volume-row > button.audio-volume-title::before");
    }
  });

  it("exposes a player-facing theme selector without replacing audio handlers", () => {
    const source = readFileSync(new URL("./SettingsModal.jsx", import.meta.url), "utf8");

    expect(source).toContain('tab === "theme"');
    expect(source).toContain("settings-tab-${tab}");
    expect(source).toContain("VISUAL_THEME_OPTIONS.map");
    expect(source).toContain("theme-choice-button");
    expect(source).toContain("setVisualTheme(theme.id)");
    expect(source).toContain("onNotice(\"\\u656c\\u8bf7\\u671f\\u5f85~\", \"success\")");
    expect(source).toContain("onChange={(event) => setAudioSettings");
    expect(source).not.toContain("const THEME_CHOICES");
    expect(source).not.toContain("VISUAL_EFFECT_LEVELS");
    expect(source).not.toContain("VISUAL_THEMES.map");
    expect(source).not.toContain("setVisualEffect");
    expect(source).not.toContain("visualEffect");
  });

  it("renders three interface theme buttons without the old page-style heading", () => {
    const source = readFileSync(new URL("./SettingsModal.jsx", import.meta.url), "utf8");
    const themeSource = readFileSync(new URL("../app/visualTheme.js", import.meta.url), "utf8");

    expect(themeSource).toContain("\\u6ca1\\u7ecf\\u8d39\\u7684\\u7b80\\u6734\\u56f4\\u68cb\\u90e8\\u98ce\\u683c");
    expect(themeSource).toContain("\\u4e2d\\u89c4\\u4e2d\\u77e9\\u7684\\u56f4\\u68cb\\u90e8\\u98ce\\u683c");
    expect(themeSource).toContain("\\u83ab\\u5854\\u91cc\\u5bb6\\u65cf\\u8d5e\\u52a9\\u7684\\u5962\\u534e\\u98ce\\u683c");
    expect(themeSource).toContain("available: true");
    expect(themeSource).toContain("available: false");
    expect(source).toContain("VISUAL_THEME_OPTIONS");
    expect(source).not.toContain("const THEME_CHOICES");
    expect(source).not.toContain("\\u4e3b\\u9898\\uff1a");
    expect(source).not.toContain("\\uff08\\u5373\\u660e\\u4eae\\u6821\\u56ed\\u98ce\\u683c\\uff09");
    expect(source).not.toContain("\\u9875\\u9762\\u98ce\\u683c");
  });

  it("keeps interface theme choices in a three-column desktop and mobile grid", () => {
    const baseCss = readFileSync(new URL("../styles/commerce/shop-settings/settings-panel.css", import.meta.url), "utf8");
    const mobileSafetyCss = readCssWithImports(new URL("../styles/mobile-adaptive/bright-school-portrait.css", import.meta.url));

    for (const css of [baseCss, mobileSafetyCss]) {
      expect(css).toContain(".theme-choice-grid");
      expect(css).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
      expect(css).toContain(".theme-choice-button");
      expect(css).toContain("min-height:");
    }

    expect(mobileSafetyCss).toContain(".settings-modal.settings-tab-theme");
    expect(mobileSafetyCss).toContain("grid-template-rows: auto auto minmax(0, 1fr) !important");
    expect(mobileSafetyCss).toContain("overflow: hidden !important");
    expect(mobileSafetyCss).toContain(".theme-settings-panel");
    expect(mobileSafetyCss).toContain("overflow: visible !important");
  });
});
