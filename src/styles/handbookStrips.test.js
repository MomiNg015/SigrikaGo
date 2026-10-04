import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readCssWithImports } from "./cssTestUtils.js";

const entry = readFileSync(new URL("./mobile-adaptive/handbook-puzzle.css", import.meta.url), "utf8");
const css = readCssWithImports(new URL("./mobile-adaptive/handbook-puzzle.css", import.meta.url));
const labels = readFileSync(new URL("./mobile-adaptive/handbook-strip-labels.css", import.meta.url), "utf8");
describe("ordinary handbook portrait strip CSS", () => {
  it("owns horizontal expansion and vertical touch expansion with paper seams", () => {
    expect(css).toMatch(/\.handbook-puzzle-board\s*\{[^}]*display: flex;/s);
    expect(css).toMatch(/\.handbook-puzzle-piece\.is-expanded\s*\{ flex-grow: 5;/);
    expect(css).toMatch(/@media \(max-width: 768px\)[\s\S]*flex-direction: column;/);
    expect(css).toMatch(/\.handbook-puzzle-piece\.is-expanded\s*\{ height: 310px;/);
    expect(css).toContain("gap: 3px;");
    expect(css).toContain("gap: 2px;");
    expect(css).not.toMatch(/rotate\(|drop-shadow\(|radial-gradient\(/);
  });

  it("keeps names background-free, uses verified font fallbacks, and alternates mobile sides", () => {
    expect(entry.trim().split(/\r?\n/)).toEqual(['@import "./handbook-strip-labels.css";', '@import "./handbook-strip-frame.css";']);
    expect(labels).toContain("background: transparent !important;");
    expect(labels).toContain("font-family: var(--font-display-accent), var(--font-window-title), sans-serif !important;");
    expect(labels).toMatch(/\.handbook-strip-name\s*\{[^}]*right: 38px;[^}]*bottom: 18px;[^}]*opacity: 0;/s);
    expect(labels).toContain(".handbook-puzzle-piece.is-expanded .handbook-strip-name { opacity: 1; }");
    expect(labels).toContain('[data-portrait-side="right"] .handbook-strip-name { left: 6px; right: auto; }');
    expect(labels).toContain("font-size: clamp(23px, 7vw, 30px);");
    expect(css).toContain("transition: left 260ms ease;");
    expect(css).not.toMatch(/transition: (?:width|height).*260ms ease/);
    expect(labels).not.toMatch(/scanline|radial-gradient|repeating-linear-gradient/);
    expect(css).not.toContain("handbook-strip-detail-action");
  });

  it("beats global interactive button fills without losing the actual clip path", () => {
    expect(css).toContain(".handbook-puzzle-tile:is(button, :hover, :focus-visible, :active)");
    expect(css).toContain("clip-path: var(--handbook-piece-clip) !important;");
    expect(css).toContain("transform: none !important;");
    expect(css).toContain("border: 0 !important;");
    expect(css).toContain(".handbook-puzzle-piece.is-unowned .handbook-puzzle-tile:is(button, :hover, :focus-visible, :active)");
    expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*\.handbook-puzzle-piece, \.handbook-puzzle-portrait, \.handbook-puzzle-silhouette \{ transition: none;/);
    expect(css).not.toContain(".character-card");
  });
});
