import { describe, expect, it } from "vitest";
import { listShopItems, purchaseShopItem, seedBuiltinShopItems } from "./shop.js";

describe("shop", () => {
  it("lists enabled shop items with final prices", async () => {
    const response = await listShopItems({
      shopItem: {
        findMany: async () => [{
          id: "shop-1",
          name: "购买达妮娅",
          category: "character",
          targetId: "danea",
          priceCoins: 100,
          discountPercent: 25,
          purchasable: true,
          enabled: true,
          sortOrder: 1,
          description: "解锁角色",
          imageUrl: "/assets/Danea_centered.png"
        }]
      }
    });

    expect(response.items[0].finalPrice).toBe(75);
  });

  it("deducts coins and grants a purchased character", async () => {
    const user = {
      id: "user-1",
      username: "moming",
      role: "player",
      status: "active",
      rank: "18级",
      rating: 1000,
      wins: 0,
      losses: 0,
      coins: 120,
      selectedCharacter: "sigrika",
      ownedCharacters: "sigrika",
      ownedItems: "",
      ownedDecorations: ""
    };
    const item = {
      id: "shop-1",
      name: "购买达妮娅",
      category: "character",
      targetId: "danea",
      priceCoins: 100,
      discountPercent: 10,
      purchasable: true,
      enabled: true
    };
    const prisma = transactionShopPrisma(user, item);

    const response = await purchaseShopItem({ prisma, userId: user.id, itemId: item.id });

    expect(response.user.coins).toBe(30);
    expect(response.user.ownedCharacters).toContain("denia");
  });

  it("deducts coins and grants a purchased decoration", async () => {
    const user = {
      id: "user-1",
      username: "moming",
      role: "player",
      status: "active",
      rank: "18级",
      rating: 1000,
      wins: 0,
      losses: 0,
      coins: 80,
      selectedCharacter: "sigrika",
      ownedCharacters: "sigrika",
      ownedItems: "",
      ownedDecorations: ""
    };
    const item = {
      id: "shop-1",
      name: "月光头像框",
      category: "decoration",
      targetId: "moon-frame",
      priceCoins: 80,
      discountPercent: 50,
      purchasable: true,
      enabled: true
    };
    const prisma = transactionShopPrisma(user, item);

    const response = await purchaseShopItem({ prisma, userId: user.id, itemId: item.id });

    expect(response.user.coins).toBe(40);
    expect(response.user.ownedDecorations).toContain("moon-frame");
  });

  it("lists item stock remaining for the current user without changing global stock", async () => {
    const response = await listShopItems({
      user: {
        findUnique: async () => ({
          itemPurchaseCounts: JSON.stringify({ "dream-ticket": 2 })
        })
      },
      shopItem: {
        findMany: async () => [{
          id: "shop-1",
          name: "梦境券",
          category: "item",
          targetId: "dream-ticket",
          itemTargetType: "self",
          stockQuantity: 3,
          priceCoins: 50,
          discountPercent: 0,
          purchasable: true,
          enabled: true,
          sortOrder: 1,
          description: "",
          imageUrl: ""
        }]
      }
    }, "user-1");

    expect(response.items[0]).toMatchObject({
      stockQuantity: 3,
      purchasedCount: 2,
      remainingStock: 1
    });
  });

  it("deducts coins, records per-user purchase count, and adds a purchased item quantity", async () => {
    const user = {
      id: "user-1",
      username: "moming",
      role: "player",
      status: "active",
      rank: "18级",
      rating: 1000,
      wins: 0,
      losses: 0,
      coins: 200,
      selectedCharacter: "sigrika",
      ownedCharacters: "sigrika",
      ownedItems: JSON.stringify({ "dream-ticket": 1 }),
      itemPurchaseCounts: JSON.stringify({ "dream-ticket": 1 }),
      ownedDecorations: ""
    };
    const item = {
      id: "shop-1",
      name: "梦境券",
      category: "item",
      targetId: "dream-ticket",
      itemTargetType: "self",
      stockQuantity: 3,
      priceCoins: 50,
      discountPercent: 0,
      purchasable: true,
      enabled: true
    };
    const updates = [];
    const prisma = transactionShopPrisma(user, item, updates);

    const response = await purchaseShopItem({ prisma, userId: user.id, itemId: item.id });

    expect(response.user.coins).toBe(150);
    expect(response.user.ownedItems).toContainEqual({ itemId: "dream-ticket", quantity: 2 });
    expect(response.item).toMatchObject({ stockQuantity: 3, purchasedCount: 2, remainingStock: 1 });
    expect(updates).toContainEqual(["user.update", expect.objectContaining({
      itemPurchaseCounts: JSON.stringify({ "dream-ticket": 2 })
    })]);
    expect(updates.some(([type]) => type === "shopItem.update")).toBe(false);
  });

  it("rejects item purchase when the current user's shop stock is sold out", async () => {
    const user = {
      id: "user-1",
      username: "moming",
      role: "player",
      status: "active",
      rank: "18级",
      rating: 1000,
      wins: 0,
      losses: 0,
      coins: 200,
      selectedCharacter: "sigrika",
      ownedCharacters: "sigrika",
      ownedItems: JSON.stringify({ "dream-ticket": 1 }),
      itemPurchaseCounts: JSON.stringify({ "dream-ticket": 3 }),
      ownedDecorations: ""
    };
    const item = {
      id: "shop-1",
      name: "梦境券",
      category: "item",
      targetId: "dream-ticket",
      itemTargetType: "self",
      stockQuantity: 3,
      priceCoins: 50,
      discountPercent: 0,
      purchasable: true,
      enabled: true
    };
    const updates = [];
    const prisma = transactionShopPrisma(user, item, updates);

    await expect(purchaseShopItem({ prisma, userId: user.id, itemId: item.id })).rejects.toThrow("道具库存不足");
    expect(updates).toEqual([]);
  });

  it("seeds Baconbits as a 9999 coin shop character", async () => {
    const calls = [];
    await seedBuiltinShopItems({
      shopItem: {
        findFirst: async (query) => {
          calls.push(["findFirst", query]);
          return null;
        },
        create: async ({ data }) => {
          calls.push(["create", data]);
          return data;
        }
      }
    });

    expect(calls).toContainEqual([
      "create",
      expect.objectContaining({
        name: "猪小仙",
        category: "character",
        targetId: "baconbits",
        priceCoins: 9999,
        imageUrl: "/assets/baconbits.png"
      })
    ]);
  });

  it("seeds the paw stone decoration as a 500 coin shop decoration", async () => {
    const calls = [];
    await seedBuiltinShopItems({
      shopItem: {
        findFirst: async (query) => {
          calls.push(["findFirst", query]);
          return null;
        },
        create: async ({ data }) => {
          calls.push(["create", data]);
          return data;
        }
      }
    });

    expect(calls).toContainEqual([
      "create",
      expect.objectContaining({
        name: "爪印棋子",
        category: "decoration",
        targetId: "paw-stone",
        priceCoins: 500,
        imageUrl: "/assets/decorations/paw-stone-preview.png"
      })
    ]);
  });

  it("seeds the papa gan and peach decoration as a 1000 coin shop decoration", async () => {
    const calls = [];
    await seedBuiltinShopItems({
      shopItem: {
        findFirst: async (query) => {
          calls.push(["findFirst", query]);
          return null;
        },
        create: async ({ data }) => {
          calls.push(["create", data]);
          return data;
        }
      }
    });

    expect(calls).toContainEqual([
      "create",
      expect.objectContaining({
        name: "耙耙柑和水蜜桃",
        category: "decoration",
        targetId: "papagan-peach-stone",
        priceCoins: 1000,
        imageUrl: "/assets/decorations/papagan-peach-stone-preview.png"
      })
    ]);
  });

  it("seeds rainbow bean candy as a limited character-targeted item", async () => {
    const calls = [];
    await seedBuiltinShopItems({
      shopItem: {
        findFirst: async (query) => {
          calls.push(["findFirst", query]);
          return null;
        },
        create: async ({ data }) => {
          calls.push(["create", data]);
          return data;
        }
      }
    });

    expect(calls).toContainEqual([
      "create",
      expect.objectContaining({
        name: "彩虹豆豆跳跳糖",
        category: "item",
        targetId: "rainbow-bean-candy",
        itemTargetType: "character",
        stockQuantity: 10,
        priceCoins: 10,
        description: "产地不明的糖果，据说有神秘的效果",
        imageUrl: "/assets/items/rainbow-bean-candy.png"
      })
    ]);
  });

  it("does not overwrite existing builtin shop items during startup seeding", async () => {
    const existing = {
      id: "shop-existing",
      name: "后台自定义装饰商品",
      category: "decoration",
      targetId: "paw-stone",
      priceCoins: 777,
      description: "后台保存的介绍"
    };
    const calls = [];
    await seedBuiltinShopItems({
      shopItem: {
        findFirst: async (query) => {
          calls.push(["findFirst", query]);
          return query.where.targetId === "paw-stone" ? existing : null;
        },
        update: async ({ data }) => {
          calls.push(["update", data]);
          return data;
        },
        create: async ({ data }) => {
          calls.push(["create", data]);
          return data;
        }
      }
    });

    expect(calls).not.toContainEqual([
      "update",
      expect.objectContaining({ targetId: "paw-stone" })
    ]);
  });
});

function transactionShopPrisma(user, item, updates = []) {
  return {
    $transaction: async (callback) => callback({
      user: {
        findUnique: async () => user,
        update: async ({ data }) => {
          updates.push(["user.update", data]);
          return { ...user, ...data };
        }
      },
      shopItem: {
        findUnique: async () => item,
        update: async ({ data }) => {
          updates.push(["shopItem.update", data]);
          return { ...item, ...data };
        }
      }
    })
  };
}
