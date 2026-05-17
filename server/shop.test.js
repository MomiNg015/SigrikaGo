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
    expect(response.user.ownedCharacters).toContain("danea");
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

    expect(calls.at(-1)).toEqual([
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
});

function transactionShopPrisma(user, item) {
  return {
    $transaction: async (callback) => callback({
      user: {
        findUnique: async () => user,
        update: async ({ data }) => ({ ...user, ...data })
      },
      shopItem: {
        findUnique: async () => item
      }
    })
  };
}
