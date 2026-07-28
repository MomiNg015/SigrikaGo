import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readCssWithImports } from "../styles/cssTestUtils.js";

function readCssFixture(path) {
  return readCssWithImports(new URL(path, import.meta.url));
}

describe("IRIS Database production contract", () => {
  it("keeps both character-art surfaces image-free", () => {
    const source = readFileSync(new URL("./IrisDatabase.jsx", import.meta.url), "utf8");
    const homeSource = readFileSync(new URL("./HomeScreen.jsx", import.meta.url), "utf8");

    expect(homeSource).toContain('import IrisDatabase from "./IrisDatabase.jsx"');
    expect(homeSource).toContain(
      "<IrisDatabase greeting={siteSettings.irisGreeting} links={siteSettings.irisLinks} />"
    );
    expect(source).toContain("iris-entry-portrait-slot");
    expect(source).toContain("iris-entry-shard");
    expect(source).toContain("iris-entry-nodes");
    expect(source).toContain("iris-database-greeting");
    expect(source).toContain("iris-database-portrait-slot");
    expect(source).toContain("iris-database-edge-stream");
    expect(source).toContain("iris-link-index");
    expect(source).not.toContain("<img");
    expect(source).not.toContain("iris-edge-chibi-v1");
    expect(source).not.toContain("iris-modal-portrait-v1");
    expect(source).not.toContain("greetingCollapsed");
    expect(source).not.toContain("setTimeout");
    expect(source).not.toContain("is-collapsed");
  });

  it("owns fixed viewport placement and desktop/mobile modal geometry", () => {
    const baseCss = readCssFixture("../styles/base.css");
    const homeCss = readCssFixture("../styles/home-terminal.css");
    const modalCss = readCssFixture("../styles/modals.css");
    const brightHomeCss = readCssFixture("../styles/themes/bright-school/home.css");
    const brightModalCss = readCssFixture("../styles/themes/bright-school/modals.css");
    const entryBlock = homeCss.match(/\.iris-database-entry\s*\{[^}]+\}/)?.[0] ?? "";
    const entryPortraitBlock =
      homeCss.match(/\.iris-entry-portrait-slot\s*\{[^}]+\}/)?.[0] ?? "";
    const modalBlock = modalCss.match(/\.iris-database-modal\s*\{[^}]+\}/)?.[0] ?? "";
    const backdropBlock =
      modalCss.match(/\.iris-database-backdrop\s*\{[^}]+\}/)?.[0] ?? "";
    const linksBlock = modalCss.match(/\.iris-database-links\s*\{[^}]+\}/)?.[0] ?? "";

    expect(
      existsSync(new URL("../../public/assets/fonts/VonwaonBitmap-16px.ttf", import.meta.url))
    ).toBe(true);
    expect(baseCss).toContain('font-family: "IRIS Vonwaon Bitmap"');
    expect(baseCss).toContain('src: url("/assets/fonts/VonwaonBitmap-16px.ttf")');
    expect(baseCss).toContain("--font-iris-bitmap:");
    expect(baseCss).toContain("--font-iris-mixed: var(--font-display-accent), var(--font-iris-bitmap)");
    expect(entryBlock).toContain("position: fixed");
    expect(entryBlock).toContain("env(safe-area-inset-right, 0px)");
    expect(entryBlock).toContain("z-index: var(--iris-entry-z)");
    expect(entryBlock).toContain("background: transparent");
    expect(entryBlock).toContain("aspect-ratio: 0.78");
    expect(entryBlock).toContain("font-family: var(--iris-data-font)");
    expect(homeCss).toContain("--iris-data-font: var(--font-iris-bitmap)");
    expect(entryPortraitBlock).toContain("background: transparent");
    expect(entryPortraitBlock).toContain("border: 0");
    expect(homeCss).toContain("@media (max-width: 768px)");
    expect(homeCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(modalBlock).toContain("grid-template-columns: minmax(290px, 0.82fr) minmax(0, 1.58fr)");
    expect(modalBlock).toContain("height: min(650px, calc(100dvh - 44px))");
    expect(modalBlock).toContain("border-radius: 0");
    expect(modalBlock).toContain("clip-path: polygon");
    expect(backdropBlock).toContain("--iris-data-font: var(--iris-mixed-font)");
    expect(backdropBlock).toContain("--iris-cn-font: var(--iris-mixed-font)");
    expect(backdropBlock).toContain("font-family: var(--iris-mixed-font)");
    expect(linksBlock).toContain("--iris-data-font: var(--iris-bitmap-font)");
    expect(linksBlock).toContain("--iris-cn-font: var(--iris-bitmap-font)");
    expect(linksBlock).toContain("font-family: var(--iris-bitmap-font)");
    expect(modalCss).toContain("grid-template-rows: minmax(175px, 34%) minmax(0, 1fr)");
    expect(modalCss).toContain(".iris-database-links");
    expect(modalCss).toContain(".iris-database-greeting");
    expect(modalCss).not.toContain(".iris-database-greeting.is-collapsed");
    expect(modalCss).toContain(".iris-database-edge-stream");
    expect(modalCss).toContain(".iris-link-index");
    expect(modalCss).toContain("overflow-y: auto");
    expect(modalCss).toContain("scrollbar-gutter: stable");
    expect(brightHomeCss).toContain(".iris-database-entry");
    expect(brightHomeCss).toContain("transform: translateY(-50%) !important");
    expect(brightHomeCss).toContain("font-family: var(--font-iris-bitmap) !important");
    expect(brightHomeCss).toMatch(/\.iris-entry-shard\s*\{[\s\S]*?clip-path:\s*polygon\([^}]+!important/);
    expect(brightHomeCss).toMatch(
      /\.iris-entry-data small\s*\{[\s\S]*?background:\s*transparent !important/
    );
    expect(brightModalCss).toContain(".iris-database-modal");
    expect(brightModalCss).toContain(".iris-database-portrait-panel");
    expect(brightModalCss).toContain(".iris-database-greeting");
    expect(brightModalCss).toContain("font-family: var(--iris-mixed-font) !important");
    expect(brightModalCss).toContain("font-family: var(--iris-bitmap-font) !important");
  });
});
