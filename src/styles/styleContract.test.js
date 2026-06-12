import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const rootStylesPath = fileURLToPath(new URL("../styles.css", import.meta.url));
const stylesDir = dirname(fileURLToPath(new URL("./base.css", import.meta.url)));

const ROOT_STYLE_IMPORTS = [
  "./styles/base.css",
  "./styles/admin.css",
  "./styles/lobby.css",
  "./styles/room.css",
  "./styles/modals.css",
  "./styles/commerce-settings.css",
  "./styles/responsive.css",
  "./styles/mobile-home.css",
  "./styles/home-terminal.css",
  "./styles/mobile-room.css",
  "./styles/room-terminal.css",
  "./styles/mobile-modals.css",
  "./styles/hud-components.css",
  "./styles/themes.css"
];

const DOMAIN_STYLE_FILES = new Set(ROOT_STYLE_IMPORTS.map((importPath) => basename(importPath)));
const SECONDARY_ENTRY_STYLE_FILES = new Set(["mobile-adaptive.css"]);
const TEST_STYLE_FILES = new Set(["hudComponents.test.js", "styleContract.test.js", "themeContract.test.js"]);
const DOCUMENTATION_FILES = new Set(["README.md"]);

function cssImports(source) {
  return [...source.matchAll(/@import\s+"([^"]+)";/g)].map((match) => match[1]);
}

function cssFilesUnder(dir) {
  return readdirSync(dir)
    .flatMap((entry) => {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory()) return cssFilesUnder(fullPath);
      return entry.endsWith(".css") ? [fullPath] : [];
    });
}

describe("root CSS entry contract", () => {
  it("keeps styles.css import order stable", () => {
    const source = readFileSync(rootStylesPath, "utf8");

    expect(cssImports(source)).toEqual(ROOT_STYLE_IMPORTS);
  });

  it("keeps themes.css as the final root style layer", () => {
    expect(ROOT_STYLE_IMPORTS.at(-1)).toBe("./styles/themes.css");
  });

  it("keeps top-level style files either imported or intentionally non-CSS tests", () => {
    const topLevelFiles = readdirSync(stylesDir).filter((entry) => !statSync(join(stylesDir, entry)).isDirectory());
    const unexpectedFiles = topLevelFiles.filter((entry) => {
      if (entry.endsWith(".css")) return !DOMAIN_STYLE_FILES.has(entry) && !SECONDARY_ENTRY_STYLE_FILES.has(entry);
      if (entry.endsWith(".test.js")) return !TEST_STYLE_FILES.has(entry);
      if (entry.endsWith(".md")) return !DOCUMENTATION_FILES.has(entry);
      return false;
    });

    expect(unexpectedFiles).toEqual([]);
  });

  it("keeps mobile-adaptive.css as the final theme entry safety layer", () => {
    const themeEntry = readFileSync(new URL("./themes.css", import.meta.url), "utf8");

    expect(cssImports(themeEntry).at(-1)).toBe("./mobile-adaptive.css");
  });

  it("hides native number input spinner controls while preserving number inputs", () => {
    const baseCss = readFileSync(new URL("./base.css", import.meta.url), "utf8");

    expect(baseCss).toContain('input[type="number"]');
    expect(baseCss).toContain("appearance: textfield");
    expect(baseCss).toContain('input[type="number"]::-webkit-outer-spin-button');
    expect(baseCss).toContain('input[type="number"]::-webkit-inner-spin-button');
    expect(baseCss).toContain("-webkit-appearance: none");
  });

  it("keeps the mobile interaction safety layer touch friendly", () => {
    const mobileCss = readFileSync(new URL("./mobile-adaptive.css", import.meta.url), "utf8");

    expect(mobileCss).toContain("--mobile-tap-duration: 120ms");
    expect(mobileCss).toContain("-webkit-tap-highlight-color: transparent");
    expect(mobileCss).toContain(".point.previewable:active");
    expect(mobileCss).toContain("touch-action: none");
    expect(mobileCss).toContain("@keyframes mobile-sheet-in");
    expect(mobileCss).toContain("@media (max-width: 768px) and (prefers-reduced-motion: reduce)");
  });

  it("keeps nested CSS files under the theme entry map", () => {
    const nestedCssFiles = cssFilesUnder(stylesDir)
      .map((filePath) => relative(stylesDir, filePath).replaceAll("\\", "/"))
      .filter((filePath) => filePath.includes("/"));

    expect(nestedCssFiles.every((filePath) => filePath.startsWith("themes/"))).toBe(true);
  });
});
