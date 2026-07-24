import { describe, expect, it, vi } from "vitest";
import { ADMIN_DEFAULT_CONFIG } from "./adminDefaultSnapshot.js";
import { seedAdminDefaultConfig, syncAdminDefaultConfig } from "./adminDefaultSeed.js";

describe("admin default config seed", () => {
  it("ships the confirmed glossary and structured builtin skill copy", () => {
    expect(ADMIN_DEFAULT_CONFIG.skillTraits.map((trait) => trait.name)).toEqual([
      "疾走",
      "飞刀",
      "喷涂棋子",
      "禁地",
      "禁先",
      "被动",
      "派生",
      "隐藏手"
    ]);
    const changli = ADMIN_DEFAULT_CONFIG.characters.find((character) => character.slug === "changli");
    const nabomo = ADMIN_DEFAULT_CONFIG.characters.find((character) => character.slug === "nabomo");
    const aemeath = ADMIN_DEFAULT_CONFIG.characters.find((character) => character.slug === "aemeath");
    const voyageStar = JSON.parse(aemeath.skill.paramsJson).derivedSkills[0];

    expect(changli.skill.description).toMatch(/^【禁先】【疾走】/);
    expect(nabomo.skill.description).toMatch(/^【被动】/);
    expect(voyageStar.description).toMatch(/^【派生】【疾走】/);
    for (const description of [changli.skill.description, nabomo.skill.description, voyageStar.description]) {
      expect(description).not.toMatch(/超频[：:]\s*\d/);
    }
  });

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
    expect(calls).toContainEqual(["costume.create", expect.objectContaining({
      data: expect.objectContaining({
        id: "snapshot-costume",
        characterSlug: "snapshot-character",
        priceCoins: 600
      })
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
    expect(calls).toContainEqual(["skillTrait.create", {
      data: { id: "trait-snapshot", name: "疾走", definition: "不消耗落子。", sortOrder: 0 }
    }]);
    expect(calls).toContainEqual(["storyScript.create", expect.objectContaining({
      data: expect.objectContaining({
        id: "story-snapshot",
        key: "story.snapshot",
        draftInitialBoardJson: "{\"mode\":\"spark\",\"stones\":[]}",
        publishedInitialBoardJson: "{\"mode\":\"spark\",\"stones\":[]}"
      })
    })]);
    expect(calls).toContainEqual(["announcementEntry.create", expect.objectContaining({
      data: expect.objectContaining({
        id: "announcement-snapshot",
        kind: "announcement",
        title: "Snapshot Announcement"
      })
    })]);
    expect(calls).toContainEqual(["onboardingStoryScript.create", expect.objectContaining({
      data: expect.objectContaining({
        id: "singleton",
        draftStartNodeId: "start"
      })
    })]);
  });

  it("preserves existing non-user admin rows during startup seeding", async () => {
    const calls = [];
    const existing = {
      skillTraits: new Set(["trait-snapshot"]),
      characters: new Set(["snapshot-character"]),
      decorations: new Set(["snapshot-decoration"]),
      costumes: new Set(["snapshot-costume"]),
      shopTargets: new Set(["decoration:snapshot-decoration"]),
      gachaPools: new Set(["pool-snapshot"]),
      rewardAssets: new Set(["reward-snapshot"]),
      achievements: new Set(["achievement-snapshot"]),
      storyScripts: new Set(["story.snapshot"]),
      announcements: new Set(["announcement-snapshot"]),
      onboardingStoryScripts: new Set(["singleton"])
    };
    const prisma = adminDefaultSeedPrisma({ calls, existing });

    await seedAdminDefaultConfig(prisma, sampleSnapshot);

    expect(calls.some(([name]) => name === "character.create")).toBe(false);
    expect(calls.some(([name]) => name === "skillTrait.create")).toBe(false);
    expect(calls.some(([name]) => name === "character.update")).toBe(false);
    expect(calls.some(([name]) => name === "decoration.create")).toBe(false);
    expect(calls.some(([name]) => name === "decoration.update")).toBe(false);
    expect(calls.some(([name]) => name === "costume.create")).toBe(false);
    expect(calls.some(([name]) => name === "costume.update")).toBe(false);
    expect(calls.some(([name]) => name === "shopItem.create")).toBe(false);
    expect(calls.some(([name]) => name === "shopItem.update")).toBe(false);
    expect(calls.some(([name]) => name === "gachaPool.create")).toBe(false);
    expect(calls.some(([name]) => name === "gachaPool.update")).toBe(false);
    expect(calls.some(([name]) => name === "achievementRewardAsset.create")).toBe(false);
    expect(calls.some(([name]) => name === "achievementRewardAsset.update")).toBe(false);
    expect(calls.some(([name]) => name === "achievement.create")).toBe(false);
    expect(calls.some(([name]) => name === "achievement.update")).toBe(false);
    expect(calls.some(([name]) => name === "storyScript.create")).toBe(false);
    expect(calls.some(([name]) => name === "storyScript.update")).toBe(false);
    expect(calls.some(([name]) => name === "announcementEntry.create")).toBe(false);
    expect(calls.some(([name]) => name === "announcementEntry.update")).toBe(false);
    expect(calls.some(([name]) => name === "onboardingStoryScript.create")).toBe(false);
    expect(calls.some(([name]) => name === "onboardingStoryScript.update")).toBe(false);
    expect(calls).toContainEqual(["siteSetting.upsert", expect.objectContaining({
      update: {}
    })]);
    expect(calls).toContainEqual(["musicTrackSetting.upsert", expect.objectContaining({
      update: {}
    })]);
  });

  it("overwrites matching non-user admin rows only during explicit deployment sync", async () => {
    const calls = [];
    const existing = {
      skillTraits: new Set(["trait-snapshot"]),
      characters: new Set(["snapshot-character"]),
      decorations: new Set(["snapshot-decoration"]),
      costumes: new Set(["snapshot-costume"]),
      shopTargets: new Set(["decoration:snapshot-decoration"]),
      gachaPools: new Set(["pool-snapshot"]),
      rewardAssets: new Set(["reward-snapshot"]),
      achievements: new Set(["achievement-snapshot"]),
      storyScripts: new Set(["story.snapshot"]),
      announcements: new Set(["announcement-snapshot"]),
      onboardingStoryScripts: new Set(["singleton"])
    };
    const prisma = adminDefaultSeedPrisma({ calls, existing });

    await syncAdminDefaultConfig(prisma, sampleSnapshot);

    expect(calls).toContainEqual(["siteSetting.upsert", expect.objectContaining({
      update: { value: "Snapshot Home" }
    })]);
    expect(calls).toContainEqual(["skillTrait.upsert", expect.objectContaining({
      update: expect.objectContaining({ definition: "不消耗落子。" })
    })]);
    expect(calls).toContainEqual(["character.update", expect.objectContaining({
      where: { slug: "snapshot-character" },
      data: expect.objectContaining({
        name: "Snapshot Character",
        skill: { upsert: expect.any(Object) }
      })
    })]);
    expect(calls).toContainEqual(["decoration.update", expect.objectContaining({
      where: { slug: "snapshot-decoration" }
    })]);
    expect(calls).toContainEqual(["costume.update", expect.objectContaining({
      where: { id: "snapshot-costume" },
      data: expect.objectContaining({ priceCoins: 600 })
    })]);
    expect(calls).toContainEqual(["shopItem.update", expect.objectContaining({
      where: { id: "shop-existing" }
    })]);
    expect(calls).toContainEqual(["gachaPool.update", expect.objectContaining({
      where: { id: "pool-snapshot" }
    })]);
    expect(calls).toContainEqual(["gachaPrize.upsert", expect.objectContaining({
      where: { id: "prize-snapshot" },
      update: expect.objectContaining({ poolId: "pool-snapshot" })
    })]);
    expect(calls).toContainEqual(["achievementRewardAsset.upsert", expect.any(Object)]);
    expect(calls).toContainEqual(["achievement.upsert", expect.any(Object)]);
    expect(calls).toContainEqual(["musicTrackSetting.upsert", expect.objectContaining({
      update: { displayName: "Snapshot Track" }
    })]);
    expect(calls).toContainEqual(["storyScript.upsert", expect.any(Object)]);
    expect(calls).toContainEqual(["announcementEntry.upsert", expect.any(Object)]);
    expect(calls).toContainEqual(["onboardingStoryScript.upsert", expect.any(Object)]);
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
  skillTraits: [{
    id: "trait-snapshot",
    name: "疾走",
    definition: "不消耗落子。",
    sortOrder: 0
  }],
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
  costumes: [{
    id: "snapshot-costume",
    name: "Snapshot Costume",
    characterSlug: "snapshot-character",
    portraitUrl: "/assets/costumes/snapshot.webp",
    candyEffectPortraitUrl: "",
    description: "Snapshot costume description.",
    illustName: "",
    illustUrl: "",
    priceCoins: 600,
    discountPercent: 0,
    shopVisible: true,
    purchasable: true,
    enabled: true,
    sortOrder: 25,
    source: "default"
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
  }],
  storyScripts: [{
    id: "story-snapshot",
    key: "story.snapshot",
    title: "Snapshot Story",
    triggerType: "onboarding",
    triggerParamsJson: "{}",
    draftStartNodeId: "start",
    draftInitialBoardJson: "{\"mode\":\"spark\",\"stones\":[]}",
    draftNodesJson: "[{\"id\":\"start\",\"text\":\"draft\"}]",
    isPublished: true,
    publishedStartNodeId: "start",
    publishedInitialBoardJson: "{\"mode\":\"spark\",\"stones\":[]}",
    publishedNodesJson: "[{\"id\":\"start\",\"text\":\"published\"}]",
    firstPublishedAt: "2026-03-04T05:06:07.000Z",
    publishedAt: null
  }],
  announcementEntries: [{
    id: "announcement-snapshot",
    kind: "announcement",
    title: "Snapshot Announcement",
    body: "Snapshot announcement body.",
    isPublished: true,
    pinned: true,
    firstPublishedAt: "2026-04-05T06:07:08.000Z",
    deletedAt: null
  }],
  onboardingStoryScripts: [{
    id: "singleton",
    draftStartNodeId: "start",
    draftNodesJson: "[{\"id\":\"start\",\"text\":\"legacy draft\"}]",
    isPublished: true,
    publishedStartNodeId: "start",
    publishedNodesJson: "[{\"id\":\"start\",\"text\":\"legacy published\"}]",
    firstPublishedAt: "2026-05-06T07:08:09.000Z",
    publishedAt: null
  }]
};

function adminDefaultSeedPrisma({ calls, existing = {} }) {
  const has = (setName, value) => existing[setName]?.has(value) ?? false;
  const delegate = (name) => ({
    findUnique: vi.fn(async ({ where }) => {
      const key = where?.id ?? where?.slug ?? where?.key;
      if (name === "achievement" && where?.key) return has("achievements", where.key) ? { id: "existing" } : null;
      if (name === "storyScript" && where?.key) return has("storyScripts", where.key) ? { id: "existing" } : null;
      if (name === "achievementRewardAsset") return has("rewardAssets", key) ? { id: key } : null;
      if (name === "announcementEntry") return has("announcements", key) ? { id: key } : null;
      if (name === "onboardingStoryScript") return has("onboardingStoryScripts", key) ? { id: key } : null;
      if (name === "gachaPool") return has("gachaPools", key) ? { id: key } : null;
      if (name === "decoration") return has("decorations", key) ? { id: key } : null;
      if (name === "costume") return has("costumes", key) ? { id: key } : null;
      if (name === "character") return has("characters", where?.slug) ? { id: "existing" } : null;
      if (name === "skillTrait") return has("skillTraits", key) ? { id: key } : null;
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
    skillTrait: delegate("skillTrait"),
    character: delegate("character"),
    decoration: delegate("decoration"),
    costume: delegate("costume"),
    shopItem: delegate("shopItem"),
    gachaPool: delegate("gachaPool"),
    gachaPrize: delegate("gachaPrize"),
    achievementRewardAsset: delegate("achievementRewardAsset"),
    achievement: delegate("achievement"),
    musicTrackSetting: delegate("musicTrackSetting"),
    storyScript: delegate("storyScript"),
    announcementEntry: delegate("announcementEntry"),
    onboardingStoryScript: delegate("onboardingStoryScript"),
    mailboxBatch: delegate("mailboxBatch"),
    mailboxMessage: delegate("mailboxMessage"),
    announcementRead: delegate("announcementRead")
  };
}
