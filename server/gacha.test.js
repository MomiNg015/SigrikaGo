import { describe, expect, it } from "vitest";
import {
  executeGachaDraw,
  listOpenGachaPools,
  toGachaPoolPayload,
  validatePrizeProbabilityTotal
} from "./gacha.js";

describe("gacha domain", () => {
  it("requires enabled prize probabilities to total 100 percent", () => {
    expect(validatePrizeProbabilityTotal([
      { enabled: true, probabilityBasisPoints: 7000 },
      { enabled: true, probabilityBasisPoints: 3000 },
      { enabled: false, probabilityBasisPoints: 9000 }
    ])).toEqual({ ok: true, totalBasisPoints: 10000 });

    expect(validatePrizeProbabilityTotal([
      { enabled: true, probabilityBasisPoints: 7000 },
      { enabled: true, probabilityBasisPoints: 2500 }
    ])).toEqual({
      ok: false,
      totalBasisPoints: 9500,
      error: "enabled prize probabilities must total 100%"
    });
  });

  it("lists only currently open enabled pools for players", async () => {
    const now = new Date("2026-06-12T12:00:00Z");
    const response = await listOpenGachaPools({
      prisma: {
        user: {
          findUnique: async () => ({ id: "user-1", coins: 300, blueGems: 4 })
        },
        gachaPool: {
          findMany: async () => [
            poolFixture({
              id: "open-pool",
              name: "Summer Capsules",
              startsAt: new Date("2026-06-01T00:00:00Z"),
              endsAt: new Date("2026-06-30T23:59:59Z")
            }),
            poolFixture({
              id: "future-pool",
              name: "Future Capsules",
              startsAt: new Date("2026-07-01T00:00:00Z"),
              endsAt: new Date("2026-07-31T23:59:59Z")
            }),
            poolFixture({
              id: "disabled-pool",
              enabled: false,
              name: "Disabled Capsules"
            })
          ]
        }
      },
      userId: "user-1",
      now
    });

    expect(response.wallet).toEqual({ coins: 300, blueGems: 4 });
    expect(response.pools.map((pool) => pool.id)).toEqual(["open-pool"]);
    expect(response.pools[0]).toMatchObject({
      name: "Summer Capsules",
      singleDrawPrice: 50,
      tenDrawPrice: 500,
      openDateRange: "2026/06/01-2026/06/30",
      featuredPrize: {
        type: "character",
        targetId: "denia",
        imageUrl: "/assets/Danea_centered.webp"
      }
    });
  });

  it("does not invent a featured prize when the pool has none", () => {
    const payload = toGachaPoolPayload(poolFixture({ featuredPrizeId: null }));

    expect(payload.featuredPrize).toBeNull();
    expect(payload.featuredPrizes).toEqual([]);
  });

  it("projects multiple featured prizes while keeping the first prize compatible", () => {
    const payload = toGachaPoolPayload(poolFixture({
      featuredPrizeId: "prize-character",
      featuredPrizeIds: JSON.stringify(["prize-character", "prize-coins"]),
      prizes: [
        { id: "prize-character", type: "character", targetId: "denia", quantity: 1, probabilityBasisPoints: 7000, enabled: true, name: "Danea" },
        { id: "prize-coins", type: "coins", targetId: "", quantity: 60, probabilityBasisPoints: 3000, enabled: true, name: "Coins" }
      ]
    }));

    expect(payload.featuredPrize).toMatchObject({ id: "prize-character", name: "Danea" });
    expect(payload.featuredPrizes).toEqual([
      expect.objectContaining({ id: "prize-character" }),
      expect.objectContaining({ id: "prize-coins" })
    ]);
  });

  it("uses pool-specific draw prices and adds chains for duplicate character quantities", async () => {
    const user = userFixture({
      coins: 200,
      ownedCharacters: "sigrika,denia"
    });
    const pool = poolFixture({
      singleDrawPrice: 70,
      tenDrawPrice: 650,
      prizes: [{
        id: "prize-character",
        type: "character",
        targetId: "denia",
        quantity: 3,
        probabilityBasisPoints: 10000,
        enabled: true
      }]
    });
    const calls = [];

    const response = await executeGachaDraw({
      prisma: transactionGachaPrisma({ user, pool, calls }),
      userId: user.id,
      poolId: pool.id,
      count: 1,
      now: new Date("2026-06-12T12:00:00Z"),
      random: () => 0.1
    });

    expect(response.user.coins).toBe(130);
    expect(response.user.characterChains.denia).toBe(3);
    expect(response.rewards).toEqual([expect.objectContaining({
      type: "character",
      targetId: "denia",
      quantity: 3,
      duplicateQuantity: 3,
      chainAdded: 3
    })]);
    expect(calls).toContainEqual(["user.update", expect.objectContaining({ coins: 130 })]);
    expect(calls).toContainEqual(["userCharacter.upsert", expect.objectContaining({
      where: { userId_characterSlug: { userId: user.id, characterSlug: "denia" } },
      update: { chainCount: { increment: 3 }, source: "gacha" }
    })]);
    expect(calls).toContainEqual(["gachaDraw.create", expect.objectContaining({
      userId: user.id,
      poolId: pool.id,
      drawCount: 1,
      coinCost: 70
    })]);
  });

  it("unlocks the first unique decoration unit and converts extra units to blue gems", async () => {
    const user = userFixture({
      coins: 500,
      blueGems: 2,
      ownedDecorations: ""
    });
    const pool = poolFixture({
      prizes: [{
        id: "prize-decoration",
        type: "decoration",
        targetId: "paw-stone",
        quantity: 3,
        probabilityBasisPoints: 10000,
        enabled: true
      }]
    });
    const calls = [];

    const response = await executeGachaDraw({
      prisma: transactionGachaPrisma({ user, pool, calls }),
      userId: user.id,
      poolId: pool.id,
      count: 1,
      now: new Date("2026-06-12T12:00:00Z"),
      random: () => 0.1
    });

    expect(response.user.ownedDecorations).toContain("paw-stone");
    expect(response.user.blueGems).toBe(4);
    expect(response.rewards).toEqual([expect.objectContaining({
      type: "decoration",
      targetId: "paw-stone",
      quantity: 3,
      unlockedQuantity: 1,
      duplicateQuantity: 2,
      blueGemsAdded: 2
    })]);
    expect(calls).toContainEqual(["user.update", expect.objectContaining({
      ownedDecorations: "paw-stone",
      blueGems: 4
    })]);
  });
});

function poolFixture(overrides = {}) {
  const prizes = overrides.prizes ?? [{
    id: "prize-featured",
    type: "character",
    targetId: "denia",
    quantity: 1,
    probabilityBasisPoints: 10000,
    enabled: true,
    name: "Danea",
    imageUrl: "/assets/Danea_centered.webp"
  }];
  return {
    id: "pool-1",
    name: "Featured Capsules",
    description: "",
    enabled: true,
    permanent: false,
    startsAt: new Date("2026-06-01T00:00:00Z"),
    endsAt: new Date("2026-06-30T23:59:59Z"),
    singleDrawPrice: 50,
    tenDrawPrice: 500,
    sortOrder: 1,
    featuredPrizeId: prizes[0]?.id ?? null,
    prizes,
    ...overrides
  };
}

function userFixture(overrides = {}) {
  return {
    id: "user-1",
    username: "player",
    role: "player",
    status: "active",
    rank: "3段",
    rating: 1000,
    wins: 0,
    losses: 0,
    coins: 300,
    blueGems: 0,
    selectedCharacter: "sigrika",
    selectedStoneDecoration: "",
    ownedCharacters: "sigrika",
    ownedItems: "",
    ownedDecorations: "",
    ownedMusicIds: "",
    userCharacters: [],
    userDecorations: [],
    userItems: [],
    userItemEffects: [],
    modeStats: [],
    ...overrides
  };
}

function transactionGachaPrisma({ user, pool, calls }) {
  return {
    $transaction: async (callback) => callback({
      user: {
        findUnique: async () => user,
        update: async ({ data }) => {
          calls.push(["user.update", data]);
          return { ...user, ...data };
        }
      },
      gachaPool: {
        findUnique: async () => pool
      },
      gachaDraw: {
        create: async ({ data }) => {
          calls.push(["gachaDraw.create", data]);
          return { id: "draw-1", ...data };
        }
      },
      gachaDrawReward: {
        createMany: async ({ data }) => {
          calls.push(["gachaDrawReward.createMany", data]);
          return { count: data.length };
        }
      },
      userCharacter: {
        upsert: async (query) => {
          calls.push(["userCharacter.upsert", query]);
          return query.create;
        }
      },
      userDecoration: {
        upsert: async (query) => {
          calls.push(["userDecoration.upsert", query]);
          return query.create;
        }
      },
      userItem: {
        upsert: async (query) => {
          calls.push(["userItem.upsert", query]);
          return query.create;
        }
      },
      userItemEffect: {
        upsert: async (query) => {
          calls.push(["userItemEffect.upsert", query]);
          return query.create;
        }
      },
      userProgressLedger: {
        create: async ({ data }) => {
          calls.push(["userProgressLedger.create", data]);
          return data;
        }
      }
    })
  };
}
