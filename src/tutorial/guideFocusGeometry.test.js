import { describe, expect, it } from "vitest";
import { guideFocusGeometry } from "./guideFocusGeometry.js";

describe("animated guide focus paint bounds", () => {
  it.each([
    [{ left: 1, top: 0, right: 319, bottom: 568 }, { width: 320, height: 568 }],
    [{ left: 270, top: 730, right: 380, bottom: 830 }, { width: 390, height: 844 }],
    [{ left: 700, top: 420, right: 724, bottom: 444 }, { width: 1440, height: 900 }]
  ])("keeps the largest focus phase inside the viewport", (rect, viewport) => {
    const style = guideFocusGeometry(rect, viewport, 8);
    const extraX = (style['--guide-focus-out-x'] - 1) * style.width / 2;
    const extraY = (style['--guide-focus-out-y'] - 1) * style.height / 2;
    expect(style.left - extraX).toBeGreaterThanOrEqual(3.999);
    expect(style.top - extraY).toBeGreaterThanOrEqual(3.999);
    expect(style.left + style.width + extraX).toBeLessThanOrEqual(viewport.width - 3.999);
    expect(style.top + style.height + extraY).toBeLessThanOrEqual(viewport.height - 3.999);
  });
  it("does not draw a marker for a target outside the viewport", () => {
    expect(guideFocusGeometry({ left: 0, top: 900, right: 100, bottom: 950 }, { width: 390, height: 844 })).toBeNull();
  });
});
