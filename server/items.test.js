import { describe, expect, it } from "vitest";
import { listItemInventory, parseItemEffects, parseOwnedItems, useInventoryItem } from "./items.js";

describe("items", () => {
  it("parses legacy csv inventory and json quantity inventory", () => {
    expect(parseOwnedItems("a,b,a")).toEqual({ a: 2, b: 1 });
    expect(parseOwnedItems(JSON.stringify({ a: 3, b: 0 }))).toEqual({ a: 3 });
    expect(parseItemEffects(JSON.stringify({ sigrikaCandyDisabled: true }))).toEqual({ sigrikaCandyDisabled: true });
  });

  it("lists owned item details with quantities", async () => {
    const response = await listItemInventory({
      userId: "user-1",
      prisma: inventoryPrisma({
        ownedItems: JSON.stringify({ "dream-ticket": 2 })
      })
    });

    expect(response.items).toMatchObject([
      { itemId: "dream-ticket", quantity: 2, targetType: "self" }
    ]);
  });

  it("uses a self-targeted item by consuming one quantity", async () => {
    const updates = [];
    const response = await useInventoryItem({
      userId: "user-1",
      itemId: "dream-ticket",
      prisma: inventoryPrisma({
        ownedItems: JSON.stringify({ "dream-ticket": 2 }),
        updates
      })
    });

    expect(response.user.ownedItems).toContainEqual({ itemId: "dream-ticket", quantity: 1 });
    expect(updates[0]).toEqual({ ownedItems: JSON.stringify({ "dream-ticket": 1 }) });
  });

  it("requires an owned character for character-targeted items", async () => {
    await expect(useInventoryItem({
      userId: "user-1",
      itemId: "portrait-token",
      characterId: "nabomo",
      prisma: inventoryPrisma({
        ownedCharacters: "sigrika",
        ownedItems: JSON.stringify({ "portrait-token": 1 }),
        itemTargetType: "character",
        targetId: "portrait-token"
      })
    })).rejects.toMatchObject({ status: 403 });
  });

  it("uses rainbow candy on Sigrika by disabling sortie, granting coins, and switching selected character", async () => {
    const updates = [];
    const response = await useInventoryItem({
      userId: "user-1",
      itemId: "rainbow-bean-candy",
      characterId: "sigrika",
      prisma: inventoryPrisma({
        selectedCharacter: "sigrika",
        ownedCharacters: "sigrika,denia",
        ownedItems: JSON.stringify({ "rainbow-bean-candy": 1 }),
        targetId: "rainbow-bean-candy",
        itemTargetType: "character",
        updates
      })
    });

    expect(response.effectText).toContain("西格莉卡吃下了糖果");
    expect(response.user.coins).toBe(130);
    expect(response.user.selectedCharacter).toBe("denia");
    expect(response.user.itemEffects).toMatchObject({ sigrikaCandyDisabled: true });
    expect(updates[0]).toMatchObject({
      coins: { increment: 30 },
      selectedCharacter: "denia",
      ownedItems: "{}"
    });
  });

  it("uses rainbow candy on Denia by enabling the rainbow glow effect", async () => {
    const response = await useInventoryItem({
      userId: "user-1",
      itemId: "rainbow-bean-candy",
      characterId: "denia",
      prisma: inventoryPrisma({
        ownedCharacters: "sigrika,denia",
        ownedItems: JSON.stringify({ "rainbow-bean-candy": 1 }),
        targetId: "rainbow-bean-candy",
        itemTargetType: "character"
      })
    });

    expect(response.effectText).toContain("突然全身发出了彩虹光");
    expect(response.user.itemEffects).toMatchObject({ deniaRainbowGlow: true });
  });

  it("accepts legacy Danea ownership when using candy on canonical Denia", async () => {
    const response = await useInventoryItem({
      userId: "user-1",
      itemId: "rainbow-bean-candy",
      characterId: "denia",
      prisma: inventoryPrisma({
        ownedCharacters: "sigrika,danea",
        ownedItems: JSON.stringify({ "rainbow-bean-candy": 1 }),
        targetId: "rainbow-bean-candy",
        itemTargetType: "character"
      })
    });

    expect(response.user.itemEffects).toMatchObject({ deniaRainbowGlow: true });
  });

  it("rejects repeating an active rainbow candy effect without consuming the item", async () => {
    const updates = [];
    await expect(useInventoryItem({
      userId: "user-1",
      itemId: "rainbow-bean-candy",
      characterId: "denia",
      prisma: inventoryPrisma({
        ownedCharacters: "sigrika,denia",
        ownedItems: JSON.stringify({ "rainbow-bean-candy": 1 }),
        itemEffects: JSON.stringify({ deniaRainbowGlow: true }),
        targetId: "rainbow-bean-candy",
        itemTargetType: "character",
        updates
      })
    })).rejects.toMatchObject({ status: 400 });

    expect(updates).toEqual([]);
  });

  it("rejects unsupported rainbow candy character targets without consuming the item", async () => {
    const updates = [];
    await expect(useInventoryItem({
      userId: "user-1",
      itemId: "rainbow-bean-candy",
      characterId: "aemeath",
      prisma: inventoryPrisma({
        ownedCharacters: "sigrika,aemeath",
        ownedItems: JSON.stringify({ "rainbow-bean-candy": 1 }),
        targetId: "rainbow-bean-candy",
        itemTargetType: "character",
        updates
      })
    })).rejects.toMatchObject({ status: 400 });

    expect(updates).toEqual([]);
  });
});

function inventoryPrisma({
  ownedItems = "{}",
  itemEffects = "{}",
  ownedCharacters = "sigrika",
  selectedCharacter = "sigrika",
  targetId = "dream-ticket",
  itemTargetType = "self",
  updates = []
} = {}) {
  const user = {
    id: "user-1",
    username: "moming",
    role: "player",
    status: "active",
    rank: "18级",
    rating: 1000,
    wins: 0,
    losses: 0,
    coins: 100,
    selectedCharacter,
    selectedStoneDecoration: "",
    ownedCharacters,
    ownedItems,
    itemEffects,
    ownedDecorations: ""
  };
  const item = {
    id: "shop-1",
    name: "梦境券",
    category: "item",
    targetId,
    itemTargetType,
    stockQuantity: -1,
    priceCoins: 50,
    discountPercent: 0,
    purchasable: true,
    enabled: true,
    sortOrder: 1,
    description: "效果待配置",
    imageUrl: ""
  };
  const tx = {
    user: {
      findUnique: async () => user,
      update: async ({ data }) => {
        updates.push(data);
        const nextUser = { ...user, ...data };
        if (data.coins?.increment) nextUser.coins = user.coins + data.coins.increment;
        return nextUser;
      }
    },
    shopItem: {
      findFirst: async () => item,
      findMany: async () => [item]
    }
  };
  return {
    ...tx,
    $transaction: async (callback) => callback(tx)
  };
}
