import { describe, expect, test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BoardAmbientEffects, { hasColorIllusionFog } from "./BoardAmbientEffects.jsx";
import { readCssWithImports } from "../styles/cssTestUtils.js";

describe("BoardAmbientEffects", () => {
  test("detects active Nabomo color illusion fog from passive state", () => {
    expect(hasColorIllusionFog({ passives: {} })).toBe(false);
    expect(hasColorIllusionFog({
      passives: {
        black: { colorIllusion: { active: false } },
        white: { colorIllusion: { active: true } }
      }
    })).toBe(true);
  });

  test("renders a passive non-interactive desaturation marker", () => {
    const markup = renderToStaticMarkup(createElement(BoardAmbientEffects, { active: true }));

    expect(markup).toContain("board-ambient-layer");
    expect(markup).toContain('data-ambient-effect="color-illusion-desaturate"');
    expect(markup).toContain("color-illusion-desaturate-wave");
    expect(markup).toContain('aria-hidden="true"');
  });

  test("does not render passive desaturation when presentation effects are disabled", () => {
    const markup = renderToStaticMarkup(createElement(BoardAmbientEffects, { active: true, effectsEnabled: false }));

    expect(markup).toContain("board-ambient-layer");
    expect(markup).toContain('data-ambient-effect=""');
    expect(markup).not.toContain("color-illusion-desaturate-wave");
  });

  test("keeps the color illusion board transition lightweight, persistent, and pointer transparent", () => {
    const css = readCssWithImports(new URL("../styles/room.css", import.meta.url));
    const wrapBlock = css.match(/\.board-wrap\s*\{[^}]+\}/)?.[0] ?? "";
    const surfaceBlock = css.match(/\.board-wrap\.color-illusion-board-surface::before\s*\{[^}]+\}/)?.[0] ?? "";
    const layerBlock = css.match(/\.board-ambient-layer\s*\{[^}]+\}/)?.[0] ?? "";
    const waveBlock = css.match(/\.color-illusion-desaturate-wave\s*\{[^}]+\}/)?.[0] ?? "";

    expect(wrapBlock).toContain("--nabomo-color-illusion-board-texture");
    expect(wrapBlock).toContain('url("/assets/boards/nabomo-color-illusion-board.webp")');
    expect(surfaceBlock).toContain("background: var(--nabomo-color-illusion-board-texture)");
    expect(surfaceBlock).toContain("clip-path: circle(150% at 50% 50%)");
    expect(surfaceBlock).toContain("animation: color-illusion-board-texture-spread");
    expect(layerBlock).toContain("pointer-events: none");
    expect(layerBlock).toContain("z-index: 11");
    expect(layerBlock).toContain("inset: 0");
    expect(layerBlock).toContain("overflow: hidden");
    expect(waveBlock).toContain("left: 50%");
    expect(waveBlock).toContain("top: 50%");
    expect(waveBlock).toContain("mix-blend-mode: saturation");
    expect(waveBlock).toContain("animation: color-illusion-desaturate-spread");
    expect(css).toContain("@keyframes color-illusion-board-texture-spread");
    expect(css).not.toContain("color-illusion-board-desaturate-lock");
    expect(css).not.toContain("fog-cloud");
    expect(css).not.toContain("board-ambient-canvas");
  });
});
