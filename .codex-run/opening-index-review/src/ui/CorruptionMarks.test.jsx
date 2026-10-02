import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CorruptionFragmentImage,
  CorruptionNoise,
  createCorruptionCadence,
  createCorruptionFragments,
  createCorruptionNoise
} from "./CorruptionMarks.jsx";

describe("CorruptionMarks", () => {
  it("generates stable but distinct image fragments for each damaged surface", () => {
    const first = createCorruptionFragments("home-utility-shop");
    const repeated = createCorruptionFragments("home-utility-shop");
    const other = createCorruptionFragments("home-utility-watch");

    expect(first).toEqual(repeated);
    expect(first).toHaveLength(24);
    expect(first).not.toEqual(other);
    expect(new Set(first.map((fragment) => fragment.clipPath)).size).toBe(first.length);
    expect(first.every((fragment) => fragment.clipPath.startsWith("inset("))).toBe(true);
    expect(first.filter((fragment) => fragment.missing)).toHaveLength(6);
    expect(first.map((fragment) => fragment.missing)).not.toEqual(other.map((fragment) => fragment.missing));
  });

  it("omits the deterministic missing blocks from the rendered fragment layer", () => {
    const fragments = createCorruptionFragments("home-utility-shop");
    const html = renderToStaticMarkup(
      <CorruptionFragmentImage seed="home-utility-shop" src="/shop.webp" />
    );

    expect(html.match(/class="corruption-fragment-piece"/g)).toHaveLength(
      fragments.filter((fragment) => !fragment.missing).length
    );
    expect(html).not.toContain("missing=");
  });

  it("supports denser owner-specific grids while keeping one quarter missing", () => {
    const fragments = createCorruptionFragments("home-house-access", 10, 12);
    const html = renderToStaticMarkup(
      <CorruptionFragmentImage columns={10} rows={12} seed="home-house-access" src="/book.webp" />
    );

    expect(fragments).toHaveLength(120);
    expect(fragments.filter((fragment) => fragment.missing)).toHaveLength(30);
    expect(html).toContain('data-corruption-columns="10"');
    expect(html).toContain('data-corruption-rows="12"');
    expect(html.match(/class="corruption-fragment-piece"/g)).toHaveLength(90);
  });

  it("generates dense black and white noise without using runtime randomness", () => {
    const fragments = createCorruptionNoise("home-house-access");

    expect(fragments).toHaveLength(92);
    expect(fragments).toEqual(createCorruptionNoise("home-house-access"));
    expect(new Set(fragments.map((fragment) => fragment.fill))).toEqual(new Set(["#050506", "#f4f4f5"]));
  });

  it("gives each card a stable, independently timed corruption cadence", () => {
    const sigrika = createCorruptionCadence("house-card-sigrika");
    const denia = createCorruptionCadence("house-card-denia");

    expect(sigrika).toEqual(createCorruptionCadence("house-card-sigrika"));
    expect(sigrika).not.toEqual(denia);
    expect(sigrika.cardDuration).not.toBe(denia.cardDuration);
    expect(sigrika.noiseDuration).not.toBe(denia.noiseDuration);
  });

  it("renders a requested irregular card-noise density", () => {
    const html = renderToStaticMarkup(
      <CorruptionNoise className="card-noise" count={47} seed="house-card-denia" />
    );

    expect(html.match(/<rect/g)).toHaveLength(47);
    expect(html).toContain('data-corruption-seed="house-card-denia"');
  });
});
