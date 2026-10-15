import { describe, expect, it } from "vitest";
import { portraitShowcaseAspect, portraitShowcaseViewBox } from "./PortraitShowcase.jsx";
import { PORTRAIT_VISIBLE_BOUNDS } from "./portraitVisibleBounds.js";

describe("visible portrait comparison", () => {
  it("gives tall default and wide sitting skins identical visible heights and baselines", () => {
    const sources = ["/assets/characters/handbook-chibi-sprites/denia.webp",
      "/assets/costumes/portraits/denia-costume-01.webp", "/assets/costumes/portraits/denia-costume-02.webp"];
    const aspect = portraitShowcaseAspect(sources);
    const figures = sources.map((src) => {
      const [, , left, top, width, height] = PORTRAIT_VISIBLE_BOUNDS[src];
      const frame = portraitShowcaseViewBox(src, aspect);
      const [x, y, w, h] = frame.viewBox.split(" ").map(Number);
      expect(left).toBeGreaterThan(x);
      expect(top).toBeGreaterThan(y);
      expect(left + width).toBeLessThan(x + w);
      expect(top + height).toBeLessThan(y + h);
      return { height: height / h, bottom: (top + height - y) / h, aspect: w / h };
    });
    for (const figure of figures) {
      expect(figure.height).toBeCloseTo(figures[0].height);
      expect(figure.bottom).toBeCloseTo(figures[0].bottom);
      expect(figure.aspect).toBeCloseTo(aspect);
    }
  });
  it("leaves unknown uploaded images on the centered contain fallback", () => {
    expect(portraitShowcaseViewBox("/uploads/custom.webp", 1)).toBeNull();
  });
});
