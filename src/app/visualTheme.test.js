import { describe, expect, it } from "vitest";
import {
  DEFAULT_VISUAL_THEME,
  VISUAL_THEME_CLASS_PREFIX,
  VISUAL_THEME_IDS,
  VISUAL_THEME_STORAGE_KEY,
  loadVisualTheme,
  saveVisualTheme,
  sanitizeVisualTheme,
  visualThemeClassName,
  visualThemeCssImportPath,
  visualThemeScopeSelector
} from "./visualTheme.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
}

describe("visual theme preferences", () => {
  it("sanitizes unknown theme values", () => {
    expect(DEFAULT_VISUAL_THEME).toBe("bright-school");
    expect(sanitizeVisualTheme("current")).toBe("bright-school");
    expect(sanitizeVisualTheme("original")).toBe("bright-school");
    expect(sanitizeVisualTheme("bright-school")).toBe("bright-school");
    expect(sanitizeVisualTheme("terminal")).toBe(DEFAULT_VISUAL_THEME);
    expect(sanitizeVisualTheme("unknown")).toBe(DEFAULT_VISUAL_THEME);
  });

  it("loads and saves player-facing theme preferences in storage", () => {
    const storage = memoryStorage({
      [VISUAL_THEME_STORAGE_KEY]: "original"
    });

    expect(loadVisualTheme(storage)).toBe("bright-school");
    expect(saveVisualTheme("current", storage)).toBe("bright-school");
    expect(loadVisualTheme(storage)).toBe("bright-school");
  });

  it("builds safe app shell class names", () => {
    expect(visualThemeClassName("bright-school")).toBe("theme-bright-school");
    expect(visualThemeClassName("bad")).toBe("theme-bright-school");
  });

  it("exposes stable theme extension helpers", () => {
    expect(VISUAL_THEME_CLASS_PREFIX).toBe("theme-");
    expect(VISUAL_THEME_IDS).toEqual(["bright-school"]);
    expect(visualThemeScopeSelector("bright-school")).toBe(".app-shell.player-theme-enabled.theme-bright-school");
    expect(visualThemeCssImportPath("bright-school")).toBe("./themes/bright-school.css");
    expect(visualThemeCssImportPath("bad")).toBe("./themes/bright-school.css");
  });
});
