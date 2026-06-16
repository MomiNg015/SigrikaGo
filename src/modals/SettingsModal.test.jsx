import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import SettingsModal from "./SettingsModal.jsx";

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
    const brightSchoolCss = readFileSync(new URL("../styles/themes/bright-school/modals.css", import.meta.url), "utf8");
    const mobileSafetyCss = readFileSync(new URL("../styles/mobile-adaptive/bright-school-portrait.css", import.meta.url), "utf8");

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
    expect(source).toContain("VISUAL_THEMES.map");
    expect(source).toContain("theme-choice-button");
    expect(source).toContain("onClick={() => setVisualTheme(theme.id)}");
    expect(source).toContain("onChange={(event) => setAudioSettings");
    expect(source).not.toContain("VISUAL_EFFECT_LEVELS");
    expect(source).not.toContain("setVisualEffect");
    expect(source).not.toContain("visualEffect");
  });
});
