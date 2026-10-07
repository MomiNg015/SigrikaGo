// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import CharacterBustPortrait from "./CharacterBustPortrait.jsx";
import { CHARACTERS } from "./characters.js";
import { resolveHandbookPortrait } from "./handbookPortraits.js";

afterEach(cleanup);

describe("shared character busts", () => {
  it.each(["sigrika", "denia", "aemeath", "lynae", "mornye", "chisa", "changli", "qiuyuan", "nabomo"])("frames %s proportionally from the shared face landmark", (id) => {
    const character = CHARACTERS[id];
    const portrait = resolveHandbookPortrait(character);
    const { container } = render(<CharacterBustPortrait character={character} />);
    const image = screen.getByAltText(character.name);
    const art = image.parentElement;
    expect(image.getAttribute("src")).toBe(portrait.src);
    expect(image.getAttribute("width")).toBe("832");
    expect(image.getAttribute("height")).toBe("1216");
    expect(art.style.getPropertyValue("--character-bust-ratio")).toBe("832 / 1216");
    expect(Number.parseFloat(art.style.getPropertyValue("--character-bust-anchor-x")))
      .toBeCloseTo(-portrait.focal[0] / 832 * 100);
    expect(container.querySelector('[data-standard="true"]')).toBeTruthy();
  });

  it("recovers to effective legacy art once and tries a changed standard source normally", () => {
    const { rerender } = render(<CharacterBustPortrait character={CHARACTERS.sigrika} />);
    const image = screen.getByAltText(CHARACTERS.sigrika.name);
    fireEvent.error(image);
    expect(image.getAttribute("src")).toBe(CHARACTERS.sigrika.portrait);
    expect(image.closest(".character-bust-portrait").dataset.standard).toBe("false");
    fireEvent.error(image);
    expect(image.getAttribute("src")).toBe(CHARACTERS.sigrika.portrait);
    rerender(<CharacterBustPortrait character={CHARACTERS.denia} />);
    expect(screen.getByAltText(CHARACTERS.denia.name).getAttribute("src"))
      .toBe("/assets/characters/handbook-sprites/denia.webp");
    rerender(<CharacterBustPortrait character={CHARACTERS.sigrika} />);
    expect(screen.getByAltText(CHARACTERS.sigrika.name).getAttribute("src"))
      .toBe("/assets/characters/handbook-sprites/sigrika.webp");
  });

  it("retains custom source and authored costume framing on the compositor", () => {
    render(<CharacterBustPortrait character={CHARACTERS.denia} loading="lazy" costumeSnapshot={{
      portraitUrl: "/custom-wide.webp", portraitScalePercent: 115,
      portraitOffsetXPercent: -5, portraitOffsetYPercent: 8,
    }} />);
    const image = screen.getByAltText(CHARACTERS.denia.name);
    expect(image.getAttribute("src")).toBe("/custom-wide.webp");
    expect(image.getAttribute("loading")).toBe("lazy");
    expect(image.getAttribute("width")).toBeNull();
    expect(image.parentElement.style.scale).toBe("1.15");
    expect(image.parentElement.style.translate).toBe("-5% 8%");
    fireEvent.error(image);
    expect(image.getAttribute("src")).toBe("/custom-wide.webp");
  });

  it("retries authored art sharing a failed standard URL without inheriting its fallback state", () => {
    const src = "/assets/characters/handbook-sprites/sigrika.webp";
    const { rerender } = render(<CharacterBustPortrait character={CHARACTERS.sigrika} />);
    fireEvent.error(screen.getByAltText(CHARACTERS.sigrika.name));
    expect(screen.getByAltText(CHARACTERS.sigrika.name).getAttribute("src"))
      .toBe(CHARACTERS.sigrika.portrait);

    rerender(<CharacterBustPortrait character={CHARACTERS.sigrika}
      costumeSnapshot={{ portraitUrl: src, portraitScalePercent: 110 }} />);
    const image = screen.getByAltText(CHARACTERS.sigrika.name);
    expect(image.getAttribute("src")).toBe(src);
    expect(image.parentElement.style.scale).toBe("1.1");
    expect(image.closest(".character-bust-portrait").dataset.standard).toBe("false");

    rerender(<CharacterBustPortrait character={CHARACTERS.sigrika} />);
    expect(screen.getByAltText(CHARACTERS.sigrika.name).getAttribute("src")).toBe(src);
    expect(screen.getByAltText(CHARACTERS.sigrika.name).closest(".character-bust-portrait").dataset.standard)
      .toBe("true");
  });
});
