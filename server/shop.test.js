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
          targetId: "denia",
          priceCoins: 100,
          discountPercent: 25,
          purchasable: true,
          enabled: true,
          sortOrder: 1,
          description: "解锁角色",
          imageUrl: "/assets/Danea_centered.webp"
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
      targetId: "denia",
      priceCoins: 100,
      discountPercent: 10,
      purchasable: true,
      enabled: true
    };
    const updates = [];
    const prisma = transactionShopPrisma(user, item, updates);

    const response = await purchaseShopItem({ prisma, userId: user.id, itemId: item.id });

    expect(response.user.coins).toBe(30);
    expect(response.user.ownedCharacters).toContain("denia");
    expect(updates).toContainEqual(["userProgressLedger.create", {
      userId: user.id,
      metric: "coins",
      delta: -90,
      beforeValue: 120,
      afterValue: 30,
      reason: "shop.purchase",
      refType: "shopItem",
      refId: item.id
    }]);
    expect(updates).toContainEqual(["userCharacter.upsert", expect.objectContaining({
      where: { userId_characterSlug: { userId: user.id, characterSlug: "denia" } }
    })]);
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

  it("deducts coins and grants a purchased music track", async () => {
    const user = {
      id: "user-1",
      username: "moming",
      role: "player",
      status: "active",
      rank: "2?",
      rating: 1000,
      wins: 0,
      losses: 0,
      coins: 120,
      selectedCharacter: "sigrika",
      ownedCharacters: "sigrika",
      ownedItems: "",
      ownedMusicIds: "",
      ownedDecorations: ""
    };
    const item = {
      id: "shop-1",
      name: "Sigrika Dream BGM",
      category: "music",
      targetId: "sigrika-skill-dream",
      priceCoins: 80,
      discountPercent: 0,
      purchasable: true,
      enabled: true
    };
    const updates = [];
    const prisma = transactionShopPrisma(user, item, updates);

    const response = await purchaseShopItem({ prisma, userId: user.id, itemId: item.id });

    expect(response.user.coins).toBe(40);
    expect(response.user.ownedMusicIds).toContain("sigrika-skill-dream");
    expect(updates).toContainEqual(["user.update", expect.objectContaining({
      ownedMusicIds: JSON.stringify(["sigrika-skill-dream"])
    })]);
  });

  it("rejects music purchase when the track does not exist", async () => {
    const user = {
      id: "user-1",
      username: "moming",
      role: "player",
      status: "active",
      rank: "2?",
      rating: 1000,
      wins: 0,
      losses: 0,
      coins: 120,
      selectedCharacter: "sigrika",
      ownedCharacters: "sigrika",
      ownedItems: "",
      ownedMusicIds: "",
      ownedDecorations: ""
    };
    const item = {
      id: "shop-1",
      name: "Missing BGM",
      category: "music",
      targetId: "custom-missing",
      priceCoins: 80,
      discountPercent: 0,
      purchasable: true,
      enabled: true
    };
    const prisma = transactionShopPrisma(user, item);

    await expect(purchaseShopItem({ prisma, userId: user.id, itemId: item.id })).rejects.toMatchObject({ status: 400 });
  });

  it("rejects music purchase when the track is already default unlocked", async () => {
    const user = {
      id: "user-1",
      username: "moming",
      role: "player",
      status: "active",
      rank: "2?",
      rating: 1000,
      wins: 0,
      losses: 0,
      coins: 120,
      selectedCharacter: "sigrika",
      ownedCharacters: "sigrika",
      ownedItems: "",
      ownedMusicIds: "",
      ownedDecorations: ""
    };
    const item = {
      id: "shop-1",
      name: "Default BGM",
      category: "music",
      targetId: "sigrika-skill-default",
      priceCoins: 80,
      discountPercent: 0,
      purchasable: true,
      enabled: true
    };
    const prisma = transactionShopPrisma(user, item);

    await expect(purchaseShopItem({ prisma, userId: user.id, itemId: item.id })).rejects.toMatchObject({ status: 400 });
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

  it("disables Baconbits sale and seeds recruitment items", async () => {
    const calls = [];
    await seedBuiltinShopItems({
      shopItem: {
        updateMany: async (query) => {
          calls.push(["updateMany", query]);
          return { count: 1 };
        },
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
        category: "item",
        targetId: "campus-recruitment-poster",
        itemTargetType: "self",
        imageUrl: "/assets/items/recruitment-poster.svg"
      })
    ]);
    expect(calls).toContainEqual([
      "updateMany",
      expect.objectContaining({
        where: expect.objectContaining({ targetId: "baconbits" }),
        data: expect.objectContaining({ purchasable: false, enabled: false })
      })
    ]);
    expect(calls).toContainEqual([
      "create",
      expect.objectContaining({
        category: "item",
        targetId: "radio-recruitment-ticket",
        itemTargetType: "self",
        imageUrl: "/assets/items/radio-recruitment-ticket.svg"
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
        imageUrl: "/assets/decorations/paw-stone-preview.webp"
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
        imageUrl: "/assets/decorations/papagan-peach-stone-preview.webp"
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
        imageUrl: "/assets/items/rainbow-bean-candy.webp"
      })
    ]);
  });

  it("seeds Qiuyuan Zhouwo as a purchasable music shop item", async () => {
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
        name: "肘我",
        category: "music",
        targetId: "qiuyuan-skill-zhouwo",
        stockQuantity: -1,
        priceCoins: 800,
        purchasable: true,
        enabled: true,
        description: "仇远的第二版技能 BGM",
        imageUrl: "/assets/items/qiuyuan-zhouwo.webp"
      })
    ]);
  });

  it("backfills the Qiuyuan Zhouwo shop image when an existing item has no image", async () => {
    const calls = [];
    await seedBuiltinShopItems({
      shopItem: {
        updateMany: async (query) => {
          calls.push(["updateMany", query]);
          return { count: 1 };
        },
        findFirst: async (query) => {
          calls.push(["findFirst", query]);
          return query.where.targetId === "qiuyuan-skill-zhouwo"
            ? { id: "shop-zhouwo", imageUrl: "" }
            : null;
        },
        create: async ({ data }) => {
          calls.push(["create", data]);
          return data;
        }
      }
    });

    expect(calls).toContainEqual([
      "updateMany",
      {
        where: {
          category: "music",
          targetId: "qiuyuan-skill-zhouwo",
          imageUrl: ""
        },
        data: {
          imageUrl: "/assets/items/qiuyuan-zhouwo.webp"
        }
      }
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
      },
      userCharacter: {
        upsert: async (query) => {
          updates.push(["userCharacter.upsert", query]);
          return query.create;
        }
      },
      userDecoration: {
        upsert: async (query) => {
          updates.push(["userDecoration.upsert", query]);
          return query.create;
        }
      },
      userItem: {
        upsert: async (query) => {
          updates.push(["userItem.upsert", query]);
          return query.create;
        }
      },
      userItemEffect: {
        upsert: async (query) => {
          updates.push(["userItemEffect.upsert", query]);
          return query.create;
        }
      },
      userProgressLedger: {
        create: async ({ data }) => {
          updates.push(["userProgressLedger.create", data]);
          return data;
        }
      }
    })
  };
}
