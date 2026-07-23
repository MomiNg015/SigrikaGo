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

  it("normalizes builtin recruitment inventory item images from current shared config", async () => {
    const response = await listItemInventory({
      userId: "user-1",
      prisma: inventoryPrisma({
        ownedItems: JSON.stringify({ "radio-recruitment-ticket": 1 }),
        targetId: "radio-recruitment-ticket",
        imageUrl: "/assets/items/radio-recruitment-ticket.svg"
      })
    });

    expect(response.items).toMatchObject([
      {
        itemId: "radio-recruitment-ticket",
        imageUrl: "/assets/items/radio-recruitment-ticket.webp",
        usable: false
      }
    ]);
  });

  it("lists the disabled memorial ticket in the warehouse but reserves it for recruitment", async () => {
    const response = await listItemInventory({
      userId: "user-1",
      prisma: inventoryPrisma({
        ownedItems: JSON.stringify({ "aemeath-flight-snow-memorial-ticket": 1 }),
        targetId: "aemeath-flight-snow-memorial-ticket",
        enabled: false,
        name: "飞行雪绒纪念券",
        description: "从飞行雪绒歌友会那里收到的特殊的奖品。上面的儿童画是怎么一回事呢？"
      })
    });

    expect(response.items).toMatchObject([{
      itemId: "aemeath-flight-snow-memorial-ticket",
      name: "飞行雪绒纪念券",
      quantity: 1,
      imageUrl: "/assets/items/aemeath-flight-snow-memorial-ticket.webp",
      usable: false
    }]);

    await expect(useInventoryItem({
      userId: "user-1",
      itemId: "aemeath-flight-snow-memorial-ticket",
      prisma: inventoryPrisma({
        ownedItems: JSON.stringify({ "aemeath-flight-snow-memorial-ticket": 1 }),
        targetId: "aemeath-flight-snow-memorial-ticket",
        enabled: false
      })
    })).rejects.toThrow("请在招募窗口使用这个道具");
  });

  it("normalizes the builtin campus recruitment poster inventory image from current shared config", async () => {
    const response = await listItemInventory({
      userId: "user-1",
      prisma: inventoryPrisma({
        ownedItems: JSON.stringify({ "campus-recruitment-poster": 1 }),
        targetId: "campus-recruitment-poster",
        imageUrl: "/assets/items/recruitment-poster.svg"
      })
    });

    expect(response.items).toMatchObject([
      {
        itemId: "campus-recruitment-poster",
        imageUrl: "/assets/items/recruitment-poster.webp",
        usable: false
      }
    ]);
  });

  it("normalizes the builtin rainbow candy inventory image from the current item asset", async () => {
    const response = await listItemInventory({
      userId: "user-1",
      prisma: inventoryPrisma({
        ownedItems: JSON.stringify({ "rainbow-bean-candy": 1 }),
        targetId: "rainbow-bean-candy",
        itemTargetType: "character",
        imageUrl: "/assets/items/rainbow-bean-candy.png"
      })
    });

    expect(response.items).toMatchObject([
      {
        itemId: "rainbow-bean-candy",
        imageUrl: "/assets/items/rainbow-bean-candy.webp",
        usable: true
      }
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

  it("accepts structured character ownership for character-targeted items", async () => {
    const response = await useInventoryItem({
      userId: "user-1",
      itemId: "rainbow-bean-candy",
      characterId: "denia",
      random: () => 0.99,
      prisma: inventoryPrisma({
        ownedCharacters: "sigrika",
        userCharacters: [{ characterSlug: "denia", source: "achievement" }],
        ownedItems: JSON.stringify({ "rainbow-bean-candy": 1 }),
        targetId: "rainbow-bean-candy",
        itemTargetType: "character"
      })
    });

    expect(response.user.itemEffects).toMatchObject({ deniaRainbowGlow: true });
  });

  it("uses accepted rainbow candy on Sigrika by disabling sortie without granting coins", async () => {
    const updates = [];
    const response = await useInventoryItem({
      userId: "user-1",
      itemId: "rainbow-bean-candy",
      characterId: "sigrika",
      random: () => 0.99,
      prisma: inventoryPrisma({
        selectedCharacter: "sigrika",
        ownedCharacters: "sigrika,denia",
        ownedItems: JSON.stringify({ "rainbow-bean-candy": 1 }),
        targetId: "rainbow-bean-candy",
        itemTargetType: "character",
        updates
      })
    });

    expect(response.itemUseOutcome).toBe("accepted");
    expect(response.effectText).toContain("暂时不能找她下棋了");
    expect(response.user.coins).toBe(100);
    expect(response.user.selectedCharacter).toBe("denia");
    expect(response.user.itemEffects).toMatchObject({ sigrikaCandyDisabled: true });
    expect(updates[0]).toMatchObject({
      selectedCharacter: "denia",
      ownedItems: "{}"
    });
    expect(updates[0]).not.toHaveProperty("coins");
  });

  it("uses rainbow candy on Denia by enabling the rainbow glow effect", async () => {
    const structuredWrites = [];
    const response = await useInventoryItem({
      userId: "user-1",
      itemId: "rainbow-bean-candy",
      characterId: "denia",
      random: () => 0.99,
      prisma: inventoryPrisma({
        ownedCharacters: "sigrika,denia",
        ownedItems: JSON.stringify({ "rainbow-bean-candy": 1 }),
        targetId: "rainbow-bean-candy",
        itemTargetType: "character",
        structuredWrites
      })
    });

    expect(response.itemUseOutcome).toBe("accepted");
    expect(response.effectText).toContain("双眼和嘴巴同时喷出了三道彩虹射线");
    expect(response.user.itemEffects).toMatchObject({ deniaRainbowGlow: true });
    expect(structuredWrites).toContainEqual(["userItem.deleteMany", expect.objectContaining({
      where: {
        userId: "user-1",
        source: "legacy",
        itemId: { notIn: [] }
      }
    })]);
    expect(structuredWrites).toContainEqual(["userItemEffect.upsert", expect.objectContaining({
      where: { userId_effectKey: { userId: "user-1", effectKey: "deniaRainbowGlow" } }
    })]);
  });

  it("returns the matching item-character story after applying a candy effect", async () => {
    const response = await useInventoryItem({
      userId: "user-1",
      itemId: "rainbow-bean-candy",
      characterId: "denia",
      random: () => 0.99,
      prisma: inventoryPrisma({
        ownedCharacters: "sigrika,denia",
        ownedItems: JSON.stringify({ "rainbow-bean-candy": 1 }),
        targetId: "rainbow-bean-candy",
        itemTargetType: "character",
        storyScripts: [{
          key: "item.rainbow-bean-candy.denia",
          title: "达妮娅的彩虹糖",
          triggerType: "item-character-use",
          triggerParamsJson: JSON.stringify({ itemId: "rainbow-bean-candy", characterId: "denia" }),
          publishedStartNodeId: "accepted-start",
          publishedNodesJson: JSON.stringify([
            { id: "accepted-start", speakerName: "达妮娅", characterId: "denia", text: "{username}！你给{characterName}吃了什么！" },
            { id: "rejected-start", speakerName: "达妮娅", characterId: "denia", text: "拒绝了。" }
          ]),
          publishedAt: new Date("2026-06-28T08:00:00.000Z")
        }]
      })
    });

    expect(response.storyScript).toMatchObject({
      key: "item.rainbow-bean-candy.denia",
      startNodeId: "accepted-start",
      nodes: [
        expect.objectContaining({ id: "accepted-start", text: "moming！你给达妮娅吃了什么！" }),
        expect.objectContaining({ id: "rejected-start", text: "拒绝了。" })
      ]
    });
    expect(response.effectText).toContain("三道彩虹射线");
  });

  it("keeps the legacy effect text fallback when no item story is published", async () => {
    const response = await useInventoryItem({
      userId: "user-1",
      itemId: "rainbow-bean-candy",
      characterId: "denia",
      random: () => 0.99,
      prisma: inventoryPrisma({
        ownedCharacters: "sigrika,denia",
        ownedItems: JSON.stringify({ "rainbow-bean-candy": 1 }),
        targetId: "rainbow-bean-candy",
        itemTargetType: "character",
        storyScripts: []
      })
    });

    expect(response.storyScript).toBeNull();
    expect(response.effectText).toContain("三道彩虹射线");
  });

  it("requires canonical Denia ownership when using candy on canonical Denia", async () => {
    const response = await useInventoryItem({
      userId: "user-1",
      itemId: "rainbow-bean-candy",
      characterId: "denia",
      random: () => 0.99,
      prisma: inventoryPrisma({
        ownedCharacters: "sigrika,denia",
        ownedItems: JSON.stringify({ "rainbow-bean-candy": 1 }),
        targetId: "rainbow-bean-candy",
        itemTargetType: "character"
      })
    });

    expect(response.user.itemEffects).toMatchObject({ deniaRainbowGlow: true });
  });

  it("uses rainbow candy on Aemeath by enabling rainbow move effects", async () => {
    const structuredWrites = [];
    const response = await useInventoryItem({
      userId: "user-1",
      itemId: "rainbow-bean-candy",
      characterId: "aemeath",
      random: () => 0.99,
      prisma: inventoryPrisma({
        ownedCharacters: "sigrika,aemeath",
        ownedItems: JSON.stringify({ "rainbow-bean-candy": 1 }),
        targetId: "rainbow-bean-candy",
        itemTargetType: "character",
        structuredWrites
      })
    });

    expect(response.itemUseOutcome).toBe("accepted");
    expect(response.effectText).toContain("彩虹落子模式");
    expect(response.user.itemEffects).toMatchObject({ aemeathRainbowMove: true });
    expect(structuredWrites).toContainEqual(["userItemEffect.upsert", expect.objectContaining({
      where: { userId_effectKey: { userId: "user-1", effectKey: "aemeathRainbowMove" } }
    })]);
  });

  it("uses rainbow candy on Lynae by enabling contrary voice effects", async () => {
    const structuredWrites = [];
    const response = await useInventoryItem({
      userId: "user-1",
      itemId: "rainbow-bean-candy",
      characterId: "lynae",
      random: () => 0.99,
      prisma: inventoryPrisma({
        ownedCharacters: "sigrika,lynae",
        ownedItems: JSON.stringify({ "rainbow-bean-candy": 1 }),
        targetId: "rainbow-bean-candy",
        itemTargetType: "character",
        structuredWrites
      })
    });

    expect(response.itemUseOutcome).toBe("accepted");
    expect(response.effectText).toContain("对局语音也开始混乱");
    expect(response.user.itemEffects).toMatchObject({ lynaeContraryVoice: true });
    expect(structuredWrites).toContainEqual(["userItemEffect.upsert", expect.objectContaining({
      where: { userId_effectKey: { userId: "user-1", effectKey: "lynaeContraryVoice" } }
    })]);
  });

  it.each([
    ["sigrika", "sigrikaCandyDisabled"],
    ["denia", "deniaRainbowGlow"],
    ["aemeath", "aemeathRainbowMove"],
    ["lynae", "lynaeContraryVoice"]
  ])("keeps the candy and user state unchanged when %s rejects it", async (characterId, effectKey) => {
    const updates = [];
    const structuredWrites = [];
    const response = await useInventoryItem({
      userId: "user-1",
      itemId: "rainbow-bean-candy",
      characterId,
      random: () => 0.349999,
      prisma: inventoryPrisma({
        selectedCharacter: "sigrika",
        ownedCharacters: "sigrika,denia,aemeath,lynae",
        ownedItems: JSON.stringify({ "rainbow-bean-candy": 1 }),
        targetId: "rainbow-bean-candy",
        itemTargetType: "character",
        updates,
        structuredWrites,
        storyScripts: [{
          key: `item.rainbow-bean-candy.${characterId}`,
          title: "糖果剧情",
          triggerType: "item-character-use",
          triggerParamsJson: JSON.stringify({ itemId: "rainbow-bean-candy", characterId }),
          publishedStartNodeId: "accepted-start",
          publishedNodesJson: JSON.stringify([
            { id: "accepted-start", text: "接受。" },
            { id: "rejected-start", text: "拒绝。" }
          ]),
          publishedAt: new Date("2026-07-22T00:00:00.000Z")
        }]
      })
    });

    expect(response.itemUseOutcome).toBe("rejected");
    expect(response.storyScript?.startNodeId).toBe("rejected-start");
    expect(response.effectText).toBe("");
    expect(response.items).toMatchObject([{ itemId: "rainbow-bean-candy", quantity: 1 }]);
    expect(response.user.coins).toBe(100);
    expect(response.user.selectedCharacter).toBe("sigrika");
    expect(response.user.itemEffects?.[effectKey]).not.toBe(true);
    expect(updates).toEqual([]);
    expect(structuredWrites).toEqual([]);
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
      characterId: "mornye",
      prisma: inventoryPrisma({
        ownedCharacters: "sigrika,mornye",
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
  userCharacters = [],
  selectedCharacter = "sigrika",
  targetId = "dream-ticket",
  itemTargetType = "self",
  imageUrl = "",
  enabled = true,
  name = "梦境券",
  description = "效果待配置",
  updates = [],
  structuredWrites = []
  , storyScripts = []
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
    userCharacters,
    ownedItems,
    itemEffects,
    ownedDecorations: ""
  };
  const item = {
    id: "shop-1",
    name,
    category: "item",
    targetId,
    itemTargetType,
    stockQuantity: -1,
    priceCoins: 50,
    discountPercent: 0,
    purchasable: true,
    enabled,
    sortOrder: 1,
    description,
    imageUrl
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
    },
    storyScript: {
      findMany: async ({ where }) => storyScripts.filter((script) => (
        script.triggerType === where.triggerType && Boolean(script.isPublished ?? true) === where.isPublished
      ))
    },
    userCharacter: {
      upsert: async (input) => {
        structuredWrites.push(["userCharacter.upsert", input]);
        return input.create;
      }
    },
    userDecoration: {
      upsert: async (input) => {
        structuredWrites.push(["userDecoration.upsert", input]);
        return input.create;
      }
    },
    userItem: {
      deleteMany: async (input) => {
        structuredWrites.push(["userItem.deleteMany", input]);
        return { count: 0 };
      },
      upsert: async (input) => {
        structuredWrites.push(["userItem.upsert", input]);
        return input.create;
      }
    },
    userItemEffect: {
      upsert: async (input) => {
        structuredWrites.push(["userItemEffect.upsert", input]);
        return input.create;
      }
    }
  };
  return {
    ...tx,
    $transaction: async (callback) => callback(tx)
  };
}
