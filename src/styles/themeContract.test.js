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

  it("keeps volatile room and replay semantics in the final theme tree", () => {
    const themeCss = readCssWithImports(new URL("./themes.css", import.meta.url));

    expect(themeCss).toContain(".replay-table-row.outcome-win:hover");
    expect(themeCss).toContain(".replay-table-row.outcome-loss:focus-visible");
    expect(themeCss).toContain(".replay-table-row.outcome-draw");
    expect(themeCss).toContain("background: linear-gradient(135deg, #fff4bd, #fffbe7) !important");
    expect(themeCss).toContain(".result-badge.win");
    expect(themeCss).toContain("color: #d91528 !important");
    expect(themeCss).toContain(".result-badge.loss");
    expect(themeCss).toContain("color: #121217 !important");
    expect(themeCss).toContain(".result-badge.draw");
    expect(themeCss).toContain("color: #138a46 !important");
    expect(themeCss).toContain(".skill-chip.spent");
    expect(themeCss).toContain("linear-gradient(135deg, #ece7e3, #d8d7d6 52%, #f5f1ea) padding-box");
    expect(themeCss).toContain("bright-school-skill-action-glow");
    expect(themeCss).toContain("bright-school-board-targeting-glow");
    expect(themeCss).toContain(":is(.territory-mark, .dead-mark, .neutral-mark)");
  });

  it("keeps Bright School mobile interaction polish in the final theme tree", () => {
    const themeCss = readCssWithImports(new URL("./themes.css", import.meta.url));

    expect(themeCss).toContain("@keyframes bright-mobile-sheet-in");
    expect(themeCss).toContain("bright-mobile-backdrop-in");
    expect(themeCss).toContain(".mobile-room-screen .point.previewable:active");
    expect(themeCss).toContain("touch-action: none !important");
    expect(themeCss).toContain("(prefers-reduced-motion: reduce)");
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
