import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  VISUAL_THEME_IDS,
  visualThemeCssImportPath,
  visualThemeScopeSelector
} from "../app/visualTheme.js";

function readThemeEntry(themeId) {
  return readFileSync(new URL(visualThemeCssImportPath(themeId), import.meta.url), "utf8");
}

function readThemeCssTree(themeId) {
  return readCssWithImports(new URL(visualThemeCssImportPath(themeId), import.meta.url));
}

describe("player theme CSS contract", () => {
  it("imports every registered player theme entry from themes.css", () => {
    const themeEntry = readFileSync(new URL("./themes.css", import.meta.url), "utf8");

    for (const themeId of VISUAL_THEME_IDS) {
      expect(themeEntry).toContain(`@import "${visualThemeCssImportPath(themeId)}";`);
    }
  });

  it("keeps each registered theme scoped to the player app shell", () => {
    for (const themeId of VISUAL_THEME_IDS) {
      const themeCss = readThemeCssTree(themeId);
      expect(themeCss).toContain(visualThemeScopeSelector(themeId));
    }
  });

  it("keeps theme entries import-oriented for future extension", () => {
    const themeEntry = readFileSync(new URL("./themes.css", import.meta.url), "utf8");
    const brightSchoolEntry = readFileSync(new URL("./themes/bright-school.css", import.meta.url), "utf8");
    const qaGuardEntry = readFileSync(new URL("./themes/bright-school/qa-guard.css", import.meta.url), "utf8");

    expect(cssImports(themeEntry)).toEqual([
      "./themes/shared.css",
      "./themes/isolation.css",
      "./themes/theme-components.css",
      "./themes/bright-school.css",
      "./mobile-adaptive.css"
    ]);
    expect(cssImports(brightSchoolEntry)).toContain("./bright-school/qa-guard.css");
    expect(cssImports(qaGuardEntry)).toEqual([
      "./quality-base.css",
      "./commerce.css",
      "./home.css",
      "./room.css",
      "./modals.css",
      "./mobile.css",
      "./effects.css"
    ]);
    expect(themeEntry).not.toContain(".app-shell.player-theme-enabled .result-badge");
    expect(qaGuardEntry).not.toContain(".app-shell.player-theme-enabled.theme-bright-school");
  });

  it("keeps the new-theme template aligned with the registry contract", () => {
    const template = readFileSync(new URL("./themes/_new-theme-template.css", import.meta.url), "utf8");

    expect(template).toContain("visualTheme.js");
    expect(template).toContain("themes.css");
    expect(template).toContain(".app-shell.player-theme-enabled.theme-example");
  });
});

function cssImports(source) {
  return [...source.matchAll(/@import\s+"([^"]+)";/g)].map((match) => match[1]);
}

function readCssWithImports(url, seen = new Set()) {
  const key = url.href;
  if (seen.has(key)) return "";
  seen.add(key);

  const css = readFileSync(url, "utf8");
  return css.replace(/@import\s+"([^"]+)";/g, (_match, importPath) => {
    return readCssWithImports(new URL(importPath, url), seen);
  });
}
