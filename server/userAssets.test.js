import { describe, expect, it } from "vitest";
import {
  legacyUserAssetsToStructuredRows,
  parseAssetList,
  parseCharacterAssetList,
  parseOwnedItemCounts,
  publicUserAssets,
  serializeAssetList,
  serializeOwnedItemCounts,
  structuredUserItemEffectSyncOperations,
  syncStructuredUserAssets
} from "./userAssets.js";

describe("user asset list helpers", () => {
  it("parses comma-separated asset lists with trimming and de-duplication", () => {
    expect(parseAssetList(" peach, , peach, paw ")).toEqual(["peach", "paw"]);
  });

  it("parses array asset lists with trimming and de-duplication", () => {
    expect(parseAssetList([" sigrika ", "", "sigrika", "denia"])).toEqual(["sigrika", "denia"]);
  });

  it("parses character ownership without resurrecting removed aliases", () => {
    expect(parseCharacterAssetList("danea, denia, sigrika")).toEqual(["danea", "denia", "sigrika"]);
  });

  it("serializes user asset lists consistently", () => {
    expect(serializeAssetList([" peach ", "paw", "peach"])).toBe("peach,paw");
  });

  it("normalizes owned item counts from legacy strings and public arrays", () => {
    expect(parseOwnedItemCounts("dream-ticket,dream-ticket, rainbow-bean-candy")).toEqual({
      "dream-ticket": 2,
      "rainbow-bean-candy": 1
    });
    expect(parseOwnedItemCounts([
      { itemId: "dream-ticket", quantity: "3" },
      { targetId: "rainbow-bean-candy", quantity: 1 },
      { id: "empty", quantity: 0 }
    ])).toEqual({
      "dream-ticket": 3,
      "rainbow-bean-candy": 1
    });
  });

  it("serializes owned item counts consistently", () => {
    expect(serializeOwnedItemCounts({
      "dream-ticket": "2",
      empty: 0,
      "rainbow-bean-candy": 1
    })).toBe(JSON.stringify({
      "dream-ticket": 2,
      "rainbow-bean-candy": 1
    }));
  });

  it("projects legacy user asset fields into structured migration rows", () => {
    expect(legacyUserAssetsToStructuredRows({
      id: "user-1",
      ownedCharacters: "denia,sigrika",
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

  it("upserts structured asset rows from legacy user fields", async () => {
    const calls = [];
    const prisma = {
      userCharacter: { upsert: async (query) => calls.push(["character", query]) },
      userDecoration: { upsert: async (query) => calls.push(["decoration", query]) },
      userItem: { upsert: async (query) => calls.push(["item", query]) },
      userItemEffect: { upsert: async (query) => calls.push(["effect", query]) }
    };

    await syncStructuredUserAssets(prisma, {
      id: "user-1",
      ownedCharacters: "denia,sigrika",
      ownedDecorations: "paw-stone",
      ownedItems: JSON.stringify({ "dream-ticket": 2 }),
      itemEffects: JSON.stringify({ deniaRainbowGlow: true })
    });

    expect(calls).toContainEqual(["character", expect.objectContaining({
      where: { userId_characterSlug: { userId: "user-1", characterSlug: "denia" } },
      create: { userId: "user-1", characterSlug: "denia", source: "legacy" },
      update: { source: "legacy" }
    })]);
    expect(calls).toContainEqual(["decoration", expect.objectContaining({
      where: { userId_decorationSlug: { userId: "user-1", decorationSlug: "paw-stone" } }
    })]);
    expect(calls).toContainEqual(["item", expect.objectContaining({
      where: { userId_itemId: { userId: "user-1", itemId: "dream-ticket" } },
      update: { quantity: 2, source: "legacy" }
    })]);
    expect(calls).toContainEqual(["effect", expect.objectContaining({
      where: { userId_effectKey: { userId: "user-1", effectKey: "deniaRainbowGlow" } },
      create: { userId: "user-1", effectKey: "deniaRainbowGlow", effectValue: "true", source: "legacy" }
    })]);
  });

  it("deletes structured asset rows that are absent from legacy fields", async () => {
    const calls = [];
    const prisma = {
      userCharacter: {
        deleteMany: async (query) => calls.push(["character.deleteMany", query])
      },
      userItem: {
        deleteMany: async (query) => calls.push(["item.deleteMany", query])
      },
      userItemEffect: {
        deleteMany: async (query) => calls.push(["effect.deleteMany", query])
      }
    };

    await syncStructuredUserAssets(prisma, {
      id: "user-1",
      ownedCharacters: "sigrika",
      ownedItems: "{}",
      itemEffects: "{}"
    });

    expect(calls).toContainEqual(["character.deleteMany", {
      where: { userId: "user-1", characterSlug: { notIn: ["sigrika"] } }
    }]);
    expect(calls).toContainEqual(["item.deleteMany", {
      where: { userId: "user-1", itemId: { notIn: [] } }
    }]);
    expect(calls).toContainEqual(["effect.deleteMany", {
      where: { userId: "user-1", effectKey: { notIn: [] } }
    }]);
  });

  it("builds item effect sync operations from room public user effect objects", () => {
    const calls = [];
    const prisma = {
      userItemEffect: {
        deleteMany: (query) => {
          calls.push(["effect.deleteMany", query]);
          return query;
        },
        upsert: (query) => {
          calls.push(["effect.upsert", query]);
          return query;
        }
      }
    };

    const operations = structuredUserItemEffectSyncOperations(prisma, {
      id: "user-1",
      itemEffects: { deniaRainbowGlow: true }
    });

    expect(operations).toHaveLength(2);
    expect(calls).toContainEqual(["effect.deleteMany", {
      where: { userId: "user-1", effectKey: { notIn: ["deniaRainbowGlow"] } }
    }]);
    expect(calls).toContainEqual(["effect.upsert", expect.objectContaining({
      where: { userId_effectKey: { userId: "user-1", effectKey: "deniaRainbowGlow" } },
      create: { userId: "user-1", effectKey: "deniaRainbowGlow", effectValue: "true", source: "legacy" }
    })]);
  });

  it("projects public assets from legacy fields and structured relations", () => {
    expect(publicUserAssets({
      rating: 1400,
      selectedCharacter: "denia",
      selectedStoneDecoration: "paw-stone",
      ownedCharacters: "baconbits,denia",
      ownedItems: JSON.stringify({ "dream-ticket": 1, "legacy-item": 9 }),
      itemEffects: JSON.stringify({ sigrikaCandyDisabled: true }),
      ownedDecorations: "legacy-decoration",
      userCharacters: [
        { characterSlug: "denia", chainCount: 2 },
        { characterSlug: "aemeath", chainCount: "3" }
      ],
      userItems: [
        { itemId: "dream-ticket", quantity: 3 },
        { itemId: "empty", quantity: 0 }
      ],
      userItemEffects: [
        { effectKey: "deniaRainbowGlow", effectValue: "true" },
        { effectKey: "inactive", effectValue: "false" }
      ],
      userDecorations: [{ decorationSlug: "paw-stone" }]
    })).toEqual({
      selectedCharacter: "denia",
      selectedStoneDecoration: "paw-stone",
      ownedCharacters: ["baconbits", "denia", "aemeath", "sigrika", "nabomo"],
      ownedItems: [
        { itemId: "dream-ticket", quantity: 3 },
        { itemId: "legacy-item", quantity: 9 }
      ],
      characterChains: {
        denia: 2,
        aemeath: 3
      },
      itemEffects: {
        sigrikaCandyDisabled: true,
        deniaRainbowGlow: true
      },
      ownedDecorations: ["legacy-decoration", "paw-stone"]
    });
  });
});
