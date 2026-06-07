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
    expect(html).toContain("type=\"range\"");
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
