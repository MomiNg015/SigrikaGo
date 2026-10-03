import { readFileSync } from "node:fs";
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
    expect(homeSource).toContain("<IrisDatabase />");
    expect(source).toContain("iris-entry-portrait-slot");
    expect(source).toContain("iris-database-portrait-slot");
    expect(source).not.toContain("<img");
    expect(source).not.toContain("iris-edge-chibi-v1");
    expect(source).not.toContain("iris-modal-portrait-v1");
  });

  it("owns fixed viewport placement and desktop/mobile modal geometry", () => {
    const homeCss = readCssFixture("../styles/home-terminal.css");
    const modalCss = readCssFixture("../styles/modals.css");
    const brightHomeCss = readCssFixture("../styles/themes/bright-school/home.css");
    const brightModalCss = readCssFixture("../styles/themes/bright-school/modals.css");
    const entryBlock = homeCss.match(/\.iris-database-entry\s*\{[^}]+\}/)?.[0] ?? "";
    const entryPortraitBlock =
      homeCss.match(/\.iris-entry-portrait-slot\s*\{[^}]+\}/)?.[0] ?? "";
    const modalBlock = modalCss.match(/\.iris-database-modal\s*\{[^}]+\}/)?.[0] ?? "";

    expect(entryBlock).toContain("position: fixed");
    expect(entryBlock).toContain("env(safe-area-inset-right, 0px)");
    expect(entryBlock).toContain("z-index: var(--iris-entry-z)");
    expect(entryBlock).toContain("background: transparent");
    expect(entryBlock).toContain("aspect-ratio: 0.78");
    expect(entryPortraitBlock).toContain("background: transparent");
    expect(entryPortraitBlock).toContain("border: 0");
    expect(homeCss).toContain("@media (max-width: 768px)");
    expect(homeCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(modalBlock).toContain("grid-template-columns: minmax(300px, 0.82fr) minmax(0, 1.18fr)");
    expect(modalBlock).toContain("height: min(600px, calc(100dvh - 48px))");
    expect(modalCss).toContain("grid-template-rows: minmax(180px, 38%) minmax(0, 1fr)");
    expect(brightHomeCss).toContain(".iris-database-entry");
    expect(brightHomeCss).toContain("transform: translateY(-50%) !important");
    expect(brightModalCss).toContain(".iris-database-modal");
    expect(brightModalCss).toContain(".iris-database-portrait-panel");
  });
});
