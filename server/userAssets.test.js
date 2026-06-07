import { describe, expect, it } from "vitest";
import {
  legacyUserAssetsToStructuredRows,
  parseAssetList,
  parseCharacterAssetList,
  serializeAssetList
} from "./userAssets.js";

describe("user asset list helpers", () => {
  it("parses comma-separated asset lists with trimming and de-duplication", () => {
    expect(parseAssetList(" peach, , peach, paw ")).toEqual(["peach", "paw"]);
  });

  it("parses array asset lists with trimming and de-duplication", () => {
    expect(parseAssetList([" sigrika ", "", "sigrika", "denia"])).toEqual(["sigrika", "denia"]);
  });

  it("normalizes character aliases while parsing owned characters", () => {
    expect(parseCharacterAssetList("danea, denia, sigrika")).toEqual(["denia", "sigrika"]);
  });

  it("serializes user asset lists consistently", () => {
    expect(serializeAssetList([" peach ", "paw", "peach"])).toBe("peach,paw");
  });

  it("projects legacy user asset fields into structured migration rows", () => {
    expect(legacyUserAssetsToStructuredRows({
      id: "user-1",
      ownedCharacters: "danea,denia,sigrika",
      ownedDecorations: " paw, paw, peach ",
      ownedItems: JSON.stringify({ "dream-ticket": 2, empty: 0 }),
      itemEffects: JSON.stringify({ deniaRainbowGlow: true, inactive: false, note: "manual" })
    })).toEqual({
      characters: [
        { userId: "user-1", characterSlug: "denia", source: "legacy" },
        { userId: "user-1", characterSlug: "sigrika", source: "legacy" }
      ],
      decorations: [
        { userId: "user-1", decorationSlug: "paw", source: "legacy" },
        { userId: "user-1", decorationSlug: "peach", source: "legacy" }
      ],
      items: [
        { userId: "user-1", itemId: "dream-ticket", quantity: 2, source: "legacy" }
      ],
      itemEffects: [
        { userId: "user-1", effectKey: "deniaRainbowGlow", effectValue: "true", source: "legacy" },
        { userId: "user-1", effectKey: "note", effectValue: "manual", source: "legacy" }
      ]
    });
  });
});
