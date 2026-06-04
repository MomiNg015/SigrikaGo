import { describe, expect, it } from "vitest";
import {
  DEFAULT_VISUAL_EFFECT,
  DEFAULT_VISUAL_THEME,
  VISUAL_EFFECT_STORAGE_KEY,
  VISUAL_THEME_STORAGE_KEY,
  loadVisualEffect,
  loadVisualTheme,
  saveVisualEffect,
  saveVisualTheme,
  sanitizeVisualEffect,
  sanitizeVisualTheme,
  visualThemeClassName
} from "./visualTheme.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
}

describe("visual theme preferences", () => {
  it("sanitizes unknown theme and effect values", () => {
    expect(sanitizeVisualTheme("current")).toBe("current");
    expect(sanitizeVisualTheme("original")).toBe("original");
    expect(sanitizeVisualTheme("bright-school")).toBe("bright-school");
    expect(sanitizeVisualTheme("terminal")).toBe(DEFAULT_VISUAL_THEME);
    expect(sanitizeVisualTheme("unknown")).toBe(DEFAULT_VISUAL_THEME);
    expect(sanitizeVisualEffect("low")).toBe("low");
    expect(sanitizeVisualEffect("expensive")).toBe(DEFAULT_VISUAL_EFFECT);
  });

  it("loads and saves player-facing theme preferences in storage", () => {
    const storage = memoryStorage({
      [VISUAL_THEME_STORAGE_KEY]: "original",
      [VISUAL_EFFECT_STORAGE_KEY]: "low"
    });

    expect(loadVisualTheme(storage)).toBe("original");
    expect(loadVisualEffect(storage)).toBe("low");
    expect(saveVisualTheme("current", storage)).toBe("current");
    expect(saveVisualEffect("standard", storage)).toBe("standard");
    expect(loadVisualTheme(storage)).toBe("current");
    expect(loadVisualEffect(storage)).toBe("standard");
  });

  it("builds safe app shell class names", () => {
    expect(visualThemeClassName("bright-school", "low")).toBe("theme-bright-school effect-low");
    expect(visualThemeClassName("bad", "bad")).toBe("theme-current effect-standard");
  });
});
