import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("App startup preload wiring", () => {
  it("passes the music track setter into startup preload", () => {
    const source = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
    const preloadCall = source.match(/useStartupPreload\(\{[\s\S]*?\n  \}\);/)?.[0] ?? "";

    expect(preloadCall).toContain("setMusicTracks");
  });

  it("keeps startup preload independent from transient socket objects", () => {
    const source = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
    const preloadCall = source.match(/useStartupPreload\(\{[\s\S]*?\n  \}\);/)?.[0] ?? "";

    expect(preloadCall).not.toContain("socket,");
  });

  it("derives the character list view through the shared catalog sorter", () => {
    const source = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

    expect(source).toContain("characterListFromCatalog");
    expect(source).toContain("characterListFromCatalog(characters)");
    expect(source).not.toContain("Object.values(characters)");
  });

  it("keeps the achievement unlock callback stable for home refresh", () => {
    const source = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

    expect(source).toContain("useCallback, useState");
    expect(source).toContain("const showAchievementUnlocks = useCallback(");
    expect(source).toContain("}, [showToast]);");
  });
});
