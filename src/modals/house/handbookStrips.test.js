import { describe, expect, it } from "vitest";
import { handbookStripArtStyle, handbookStripPage } from "./handbookStrips.js";
import { resolveHandbookPortrait } from "../../shared/handbookPortraits.js";
import { CHARACTERS } from "../../shared/characters.js";

describe("handbook strip pagination", () => {
  it("preserves the supplied catalog order and object identity across pages", () => {
    const characters = Array.from({ length: 13 }, (_, index) => ({ id: `member-${12 - index}`, sortOrder: index }));
    const original = [...characters];
    expect(handbookStripPage(characters, 0).roster).toEqual(characters.slice(0, 10));
    expect(handbookStripPage(characters, 1).roster).toEqual(characters.slice(10));
    expect(handbookStripPage(characters, 1).roster[0]).toBe(characters[10]);
    expect(characters).toEqual(original);
  });

  it("clamps stale pages when the roster shrinks and supports an empty catalog", () => {
    expect(handbookStripPage([{ id: "last" }], 5)).toEqual({ pages: 1, currentPage: 0, roster: [{ id: "last" }] });
    expect(handbookStripPage([], -1)).toEqual({ pages: 1, currentPage: 0, roster: [] });
  });
});

describe("handbook strip portrait framing", () => {
  const portrait = { isStandard: true, width: 832, height: 1216, focal: [415, 192] };
  it.each([{ mobile: false, expanded: false }, { mobile: false, expanded: true },
    { mobile: true, expanded: false }, { mobile: true, expanded: true }])("preserves aspect ratio in $mobile/$expanded", (state) => {
    const style = handbookStripArtStyle(portrait, { width: 940, height: 400 }, { ...state, count: 10 });
    expect(style.width / style.height).toBeCloseTo(832 / 1216, 8);
  });

  it("keeps desktop dimensions and eye line fixed through expansion, moving horizontally only", () => {
    const state = { mobile: false, count: 10 };
    const resting = handbookStripArtStyle(portrait, { width: 940, height: 400 }, { ...state, expanded: false });
    const expanded = handbookStripArtStyle(portrait, { width: 940, height: 400 }, { ...state, expanded: true });
    expect({ width: resting.width, height: resting.height, top: resting.top })
      .toEqual({ width: expanded.width, height: expanded.height, top: expanded.top });
    expect(expanded.left).not.toBe(resting.left);
    expect(handbookStripArtStyle(portrait, { width: 280, height: 840 }, { mobile: true, expanded: true, count: 10 }))
      .toEqual(handbookStripArtStyle(portrait, { width: 280, height: 1054 }, { mobile: true, expanded: true, count: 10 }));
  });

  it("normalizes measured standard head widths and pupils to the same desktop landmarks", () => {
    const state = { mobile: false, expanded: false, count: 10 };
    const size = { width: 940, height: 400 };
    const portraits = Object.values(CHARACTERS).map((character) => resolveHandbookPortrait(character)).filter(({ isStandard }) => isStandard);
    expect(portraits).toHaveLength(9);
    for (const portrait of portraits) {
      const style = handbookStripArtStyle(portrait, size, state);
      const scale = style.height / portrait.height;
      expect(portrait.headWidth * scale).toBeCloseTo(940 / 10 * .88, 8);
      expect(style.top + portrait.focal[1] * scale).toBeCloseTo(400 * .25, 8);
    }
  });

  it("alternates mobile face anchors by catalog index without mirroring artwork", () => {
    for (const expanded of [false, true]) {
      const left = handbookStripArtStyle(portrait, { width: 280, height: 840 }, { mobile: true, expanded, count: 10, index: 0 });
      const right = handbookStripArtStyle(portrait, { width: 280, height: 840 }, { mobile: true, expanded, count: 10, index: 1 });
      expect(left.left).toMatch(/^calc\(28%/);
      expect(right.left).toMatch(/^calc\(72%/);
      expect(left.width).toBe(right.width);
      expect(left.height).toBe(right.height);
      expect(left.transform).toBeUndefined();
    }
  });

  it("retains equipped costume framing", () => {
    const style = { scale: 1.15, translate: "8% -7%" };
    expect(handbookStripArtStyle({ ...portrait, style }, { width: 940, height: 400 }, { mobile: false, count: 10 })).toMatchObject(style);
  });

  it("preserves standard headwear and contains nonstandard art in the expanded mobile frame", () => {
    const state = { mobile: true, expanded: true, count: 10 };
    for (const focalY of [163, 192, 230]) {
      expect(handbookStripArtStyle({ ...portrait, focal: [415, focalY] }, { width: 280, height: 1054 }, state).top).toBe(8);
    }
    const custom = handbookStripArtStyle({ width: 900, height: 900, focal: [450, 450] }, { width: 280, height: 1054 }, state);
    expect(custom.top).toBe(8);
    expect(custom.height + custom.top).toBeLessThan(310);
  });

  it("keeps the existing mascot compact inside a closed mobile row", () => {
    const mascot = { width: 900, height: 900, cropWidth: 700, focal: [450, 389], visibleTop: 175 };
    const style = handbookStripArtStyle(mascot, { width: 280, height: 840 }, { mobile: true, expanded: false, count: 10 });
    expect(style.height).toBe(120);
    expect(style.top + mascot.visibleTop * style.height / mascot.height).toBeCloseTo(8, 8);
  });
});
