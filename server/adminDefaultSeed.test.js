import { describe, expect, it, vi } from "vitest";
import { ADMIN_DEFAULT_CONFIG } from "./adminDefaultSnapshot.js";
import { seedAdminDefaultConfig } from "./adminDefaultSeed.js";

describe("admin default config seed", () => {
  it("keeps QiuYuan row-slash description aligned with the runtime overclock rule", () => {
    const qiuyuan = ADMIN_DEFAULT_CONFIG.characters.find((character) => character.slug === "qiuyuan");

    expect(qiuyuan?.skill.description).toContain("超频+1");
    expect(qiuyuan?.skill.description).not.toContain("超频+2");
  });

  it("keeps the papa gan and peach deployment shop item visible and unique", () => {
    const matches = ADMIN_DEFAULT_CONFIG.shopItems.filter((item) => (
      item.category === "decoration" && item.targetId === "papagan-peach-stone"
    ));

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      name: "耙耙柑和水蜜桃",
      priceCoins: 1000,
      purchasable: true,
      enabled: true,
      sortOrder: 201
    });
  });

  it("keeps admin-saved public settings and catalog credits in the deployment snapshot", () => {
    const homeSubtitle = ADMIN_DEFAULT_CONFIG.siteSettings.find((row) => row.key === "homeSubtitle");
    const sigrika = ADMIN_DEFAULT_CONFIG.characters.find((character) => character.slug === "sigrika");
    const papaganPeach = ADMIN_DEFAULT_CONFIG.shopItems.find((item) => (
      item.category === "decoration" && item.targetId === "papagan-peach-stone"
    ));

    expect(homeSubtitle?.value).toBe("SIGRIKAGO");
    expect(sigrika).toMatchObject({
      cvName: "璃音",
      cvUrl: "https://space.bilibili.com/68435776"
    });
    expect(papaganPeach).toMatchObject({
      illustName: "憨态喵",
      illustUrl: "https://space.bilibili.com/392815021"
    });
  });

  it("creates missing non-user admin configuration from the snapshot", async () => {
    const calls = [];
    const prisma = adminDefaultSeedPrisma({ calls });

    await seedAdminDefaultConfig(prisma, sampleSnapshot);

    expect(calls).toContainEqual(["siteSetting.upsert", {
      where: { key: "homeTitle" },
      create: { key: "homeTitle", value: "Snapshot Home" },
      update: {}
    }]);
    expect(calls).toContainEqual(["character.create", expect.objectContaining({
      data: expect.objectContaining({
        slug: "snapshot-character",
        skill: { create: expect.objectContaining({ name: "Snapshot Skill" }) }
      })
    })]);
    expect(calls).toContainEqual(["decoration.create", expect.objectContaining({
      data: expect.objectContaining({ slug: "snapshot-decoration" })
    })]);
    expect(calls).toContainEqual(["shopItem.create", expect.objectContaining({
      data: expect.objectContaining({ category: "decoration", targetId: "snapshot-decoration" })
    })]);
    expect(calls).toContainEqual(["gachaPool.create", expect.objectContaining({
      data: expect.objectContaining({
        id: "pool-snapshot",
        prizes: {
          create: [expect.objectContaining({ id: "prize-snapshot" })]
        }
      })
    })]);
    expect(calls).toContainEqual(["achievementRewardAsset.create", expect.objectContaining({
      data: expect.objectContaining({ id: "reward-snapshot" })
    })]);
    expect(calls).toContainEqual(["achievement.create", expect.objectContaining({
      data: expect.objectContaining({ key: "achievement-snapshot" })
    })]);
    expect(calls).toContainEqual(["musicTrackSetting.upsert", {
      where: { id: "track-snapshot" },
      create: { id: "track-snapshot", displayName: "Snapshot Track" },
      update: {}
    }]);
  });

  it("preserves existing non-user admin rows during startup seeding", async () => {
    const calls = [];
    const existing = {
      characters: new Set(["snapshot-character"]),
      decorations: new Set(["snapshot-decoration"]),
      shopTargets: new Set(["decoration:snapshot-decoration"]),
      gachaPools: new Set(["pool-snapshot"]),
      rewardAssets: new Set(["reward-snapshot"]),
      achievements: new Set(["achievement-snapshot"])
    };
    const prisma = adminDefaultSeedPrisma({ calls, existing });

    await seedAdminDefaultConfig(prisma, sampleSnapshot);

    expect(calls.some(([name]) => name === "character.create")).toBe(false);
    expect(calls.some(([name]) => name === "character.update")).toBe(false);
    expect(calls.some(([name]) => name === "decoration.create")).toBe(false);
    expect(calls.some(([name]) => name === "decoration.update")).toBe(false);
    expect(calls.some(([name]) => name === "shopItem.create")).toBe(false);
    expect(calls.some(([name]) => name === "shopItem.update")).toBe(false);
    expect(calls.some(([name]) => name === "gachaPool.create")).toBe(false);
    expect(calls.some(([name]) => name === "gachaPool.update")).toBe(false);
    expect(calls.some(([name]) => name === "achievementRewardAsset.create")).toBe(false);
    expect(calls.some(([name]) => name === "achievementRewardAsset.update")).toBe(false);
    expect(calls.some(([name]) => name === "achievement.create")).toBe(false);
    expect(calls.some(([name]) => name === "achievement.update")).toBe(false);
    expect(calls).toContainEqual(["siteSetting.upsert", expect.objectContaining({
      update: {}
    })]);
    expect(calls).toContainEqual(["musicTrackSetting.upsert", expect.objectContaining({
      update: {}
    })]);
  });

  it("preserves saved character CV metadata when older deployment snapshots omit CV fields", async () => {
    const calls = [];
    const existing = {
      characters: new Set(["snapshot-character"])
    };
    const prisma = adminDefaultSeedPrisma({ calls, existing });

    await seedAdminDefaultConfig(prisma, sampleSnapshot);

    expect(calls.some(([name]) => name === "character.update")).toBe(false);
  });

  it("preserves saved character CV metadata even when the deployment snapshot declares it", async () => {
    const calls = [];
    const existing = {
      characters: new Set(["snapshot-character"])
    };
    const prisma = adminDefaultSeedPrisma({ calls, existing });

    await seedAdminDefaultConfig(prisma, {
      ...sampleSnapshot,
      characters: [{
        ...sampleSnapshot.characters[0],
        cvName: "Snapshot CV",
        cvUrl: "https://example.com/snapshot-cv"
      }]
    });

    expect(calls.some(([name]) => name === "character.update")).toBe(false);
  });

  it("preserves saved shop item illustration credits when older deployment snapshots omit those fields", async () => {
    const calls = [];
    const existing = {
      shopTargets: new Set(["decoration:snapshot-decoration"])
    };
    const prisma = adminDefaultSeedPrisma({ calls, existing });

    await seedAdminDefaultConfig(prisma, sampleSnapshot);

    expect(calls.some(([name]) => name === "shopItem.update")).toBe(false);
  });

  it("preserves saved shop item illustration credits even when the deployment snapshot declares them", async () => {
    const calls = [];
    const existing = {
      shopTargets: new Set(["decoration:snapshot-decoration"])
    };
    const prisma = adminDefaultSeedPrisma({ calls, existing });

    await seedAdminDefaultConfig(prisma, {
      ...sampleSnapshot,
      shopItems: [{
        ...sampleSnapshot.shopItems[0],
        illustName: "Snapshot Artist",
        illustUrl: "https://example.com/snapshot-artist"
      }]
    });

    expect(calls.some(([name]) => name === "shopItem.update")).toBe(false);
  });
});

const sampleSnapshot = {
  siteSettings: [
    { key: "homeTitle", value: "Snapshot Home" }
  ],
  characters: [{
    slug: "snapshot-character",
    name: "Snapshot Character",
    description: "Snapshot description.",
    portraitUrl: "/assets/snapshot.webp",
    portraitSource: "url",
    acquisitionMethod: "Snapshot acquisition",
    source: "default",
    palette: "#123456",
    enabled: true,
    sortOrder: 10,
    skill: {
      effectType: "erase-point",
      name: "Snapshot Skill",
      description: "Snapshot skill description.",
      uses: 1,
      freeTurn: true,
      targetRule: "empty-point",
      paramsJson: "{}",
      costType: "numeric",
      costValue: "3",
      systemMessage: "{player} casts {skill}",
      enabled: true
    }
  }],
  decorations: [{
    slug: "snapshot-decoration",
    name: "Snapshot Decoration",
    description: "Snapshot decoration description.",
    imageUrl: "/assets/snapshot-decoration.webp",
    source: "default",
    enabled: true,
    sortOrder: 20
  }],
  shopItems: [{
    name: "Snapshot Shop Item",
    category: "decoration",
    targetId: "snapshot-decoration",
    itemTargetType: "self",
    stockQuantity: -1,
    priceCoins: 100,
    discountPercent: 0,
    purchasable: true,
    enabled: true,
    sortOrder: 30,
    description: "Snapshot shop item description.",
    imageUrl: "/assets/snapshot-decoration.webp",
    source: "default"
  }],
  gachaPools: [{
    id: "pool-snapshot",
    name: "Snapshot Pool",
    description: "Snapshot pool description.",
    enabled: true,
    permanent: true,
    startsAt: null,
    endsAt: null,
    singleDrawPrice: 50,
    tenDrawPrice: 500,
    featuredPrizeId: "prize-snapshot",
    featuredPrizeIds: "[\"prize-snapshot\"]",
    sortOrder: 40,
    prizes: [{
      id: "prize-snapshot",
      type: "coins",
      targetId: "",
      quantity: 60,
      probabilityBasisPoints: 10000,
      enabled: true,
      name: "Coins",
      imageUrl: "",
      sortOrder: 0
    }]
  }],
  achievementRewardAssets: [{
    id: "reward-snapshot",
    type: "currency",
    name: "Snapshot Reward",
    description: "Snapshot reward description.",
    imageUrl: "",
    text: "100 coins",
    targetType: "coins",
    targetId: "",
    amount: 100,
    enabled: true,
    deletedAt: null,
    sortOrder: 50
  }],
  achievements: [{
    id: "achievement-id-snapshot",
    key: "achievement-snapshot",
    name: "Snapshot Achievement",
    content: "Snapshot achievement content.",
    conditionType: "total_games",
    conditionParams: "{\"value\":1}",
    rewardAssetId: "reward-snapshot",
    enabled: true,
    deletedAt: null,
    sortOrder: 60
  }],
  musicTrackSettings: [{
    id: "track-snapshot",
    displayName: "Snapshot Track"
  }]
};

function adminDefaultSeedPrisma({ calls, existing = {} }) {
  const has = (setName, value) => existing[setName]?.has(value) ?? false;
  const delegate = (name) => ({
    findUnique: vi.fn(async ({ where }) => {
      const key = where?.id ?? where?.slug ?? where?.key;
      if (name === "achievement" && where?.key) return has("achievements", where.key) ? { id: "existing" } : null;
      if (name === "achievementRewardAsset") return has("rewardAssets", key) ? { id: key } : null;
      if (name === "gachaPool") return has("gachaPools", key) ? { id: key } : null;
      if (name === "decoration") return has("decorations", key) ? { id: key } : null;
      if (name === "character") return has("characters", where?.slug) ? { id: "existing" } : null;
      return null;
    }),
    findFirst: vi.fn(async ({ where }) => {
      if (name === "shopItem") {
        return has("shopTargets", `${where?.category}:${where?.targetId}`) ? { id: "shop-existing" } : null;
      }
      return null;
    }),
    upsert: vi.fn(async (query) => {
      calls.push([`${name}.upsert`, query]);
      return query.create;
    }),
    create: vi.fn(async (query) => {
      calls.push([`${name}.create`, query]);
      return query.data;
    }),
    update: vi.fn(async (query) => {
      calls.push([`${name}.update`, query]);
      return query.data;
    })
  });

  return {
    siteSetting: delegate("siteSetting"),
    character: delegate("character"),
    decoration: delegate("decoration"),
    shopItem: delegate("shopItem"),
    gachaPool: delegate("gachaPool"),
    achievementRewardAsset: delegate("achievementRewardAsset"),
    achievement: delegate("achievement"),
    musicTrackSetting: delegate("musicTrackSetting")
  };
}
