import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./mobile-adaptive/handbook-puzzle.css", import.meta.url), "utf8");
describe("ordinary handbook portrait strip CSS", () => {
  it("owns horizontal expansion and vertical touch expansion with paper seams", () => {
    expect(css).toMatch(/\.handbook-puzzle-board\s*\{[^}]*display: flex;/s);
    expect(css).toMatch(/\.handbook-puzzle-piece\.is-expanded\s*\{ flex-grow: 4;/);
    expect(css).toMatch(/@media \(max-width: 768px\)[\s\S]*flex-direction: column;/);
    expect(css).toMatch(/\.handbook-puzzle-piece\.is-expanded\s*\{ height: 310px;/);
    expect(css).toContain("gap: 3px;");
    expect(css).toContain("gap: 2px;");
    expect(css).not.toMatch(/rotate\(|drop-shadow\(|radial-gradient\(/);
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
