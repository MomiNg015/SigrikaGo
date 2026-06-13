import { describe, expect, test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import BoardAmbientEffects, { hasColorIllusionFog } from "./BoardAmbientEffects.jsx";

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

  test("renders a passive non-interactive fog marker", () => {
    const markup = renderToStaticMarkup(createElement(BoardAmbientEffects, { active: true }));

    expect(markup).toContain("board-ambient-layer");
    expect(markup).toContain('data-ambient-effect="color-illusion-fog"');
    expect(markup).toContain("fog-cloud fog-cloud-a");
    expect(markup).toContain("fog-cloud fog-cloud-d");
    expect(markup).toContain('aria-hidden="true"');
  });

  test("keeps the color illusion fog light, feathered, and pointer transparent", () => {
    const css = readFileSync(new URL("../styles/room.css", import.meta.url), "utf8");
    const layerBlock = css.match(/\.board-ambient-layer\s*\{[^}]+\}/)?.[0] ?? "";
    const cloudBlock = css.match(/\.fog-cloud\s*\{[^}]+\}/)?.[0] ?? "";

    expect(layerBlock).toContain("pointer-events: none");
    expect(layerBlock).toContain("z-index: 11");
    expect(cloudBlock).toContain("rgba(15, 16, 19, 0.24)");
    expect(cloudBlock).toContain("mask-image: radial-gradient");
    expect(cloudBlock).toContain("mix-blend-mode: multiply");
    expect(cloudBlock).toContain("animation: color-illusion-fog-drift");
    expect(css).not.toContain('data-ambient-effect="color-illusion-fog"]::before');
  });
});
