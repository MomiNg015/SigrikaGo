import { describe, expect, it, vi } from "vitest";
import {
  CHARACTER_PORTRAIT_ASSETS,
  COSTUME_PORTRAIT_ASSETS
} from "../src/shared/characterPortraitAssetCatalog.js";
import { migrateBuiltinPortraitAssets } from "./builtinPortraitAssetMigration.js";

describe("migrateBuiltinPortraitAssets", () => {
  it("updates only exact built-in legacy character and costume presentations", async () => {
    const characterUpdateMany = vi.fn(async () => ({ count: 1 }));
    const costumeUpdateMany = vi.fn(async () => ({ count: 1 }));
    const result = await migrateBuiltinPortraitAssets({
      character: { updateMany: characterUpdateMany },
      costume: { updateMany: costumeUpdateMany }
    });

    expect(result).toEqual({
      characters: Object.keys(CHARACTER_PORTRAIT_ASSETS).length,
      costumes: Object.keys(COSTUME_PORTRAIT_ASSETS).length
    });
    expect(characterUpdateMany).toHaveBeenCalledWith({
      where: {
        slug: "sigrika",
        portraitUrl: CHARACTER_PORTRAIT_ASSETS.sigrika.legacyUrl,
        portraitSource: "url",
        source: "default"
      },
      data: {
        portraitUrl: CHARACTER_PORTRAIT_ASSETS.sigrika.url,
        portraitSource: "url"
      }
    });
    expect(costumeUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "sigrika-costume-01",
        portraitUrl: COSTUME_PORTRAIT_ASSETS["sigrika-costume-01"].legacyUrl,
        portraitScalePercent: 83,
        portraitOffsetXPercent: 0,
        portraitOffsetYPercent: 0,
        source: "default"
      },
      data: {
        portraitUrl: COSTUME_PORTRAIT_ASSETS["sigrika-costume-01"].url,
        portraitScalePercent: 100,
        portraitOffsetXPercent: 0,
        portraitOffsetYPercent: 0
      }
    });
  });

  it("is safe when narrowed test doubles omit either delegate", async () => {
    await expect(migrateBuiltinPortraitAssets({})).resolves.toEqual({
      characters: 0,
      costumes: 0
    });
  });
});
