import { describe, expect, it } from "vitest";
import { buildAdminDefaultConfig, renderAdminDefaultSnapshot } from "./export-admin-default-snapshot.mjs";

describe("admin default snapshot export", () => {
  it("serializes non-user admin configuration with catalog credit fields", async () => {
    const config = await buildAdminDefaultConfig(snapshotPrisma());

    expect(config.siteSettings).toEqual([
      { key: "homeSubtitle", value: "SIGRIKAGO" }
    ]);
    expect(config.characters[0]).toMatchObject({
      slug: "sigrika",
      cvName: "璃音",
      cvUrl: "https://space.bilibili.com/68435776",
      skill: {
        name: "星辉符文",
        paramsJson: "{}"
      }
    });
    expect(config.shopItems[0]).toMatchObject({
      category: "decoration",
      targetId: "papagan-peach-stone",
      illustName: "憨态喵",
      illustUrl: "https://space.bilibili.com/392815021"
    });
    expect(config.gachaPools[0]).toMatchObject({
      startsAt: "2026-01-02T03:04:05.000Z",
      endsAt: null,
      prizes: [expect.objectContaining({ id: "prize-1" })]
    });
    expect(config.achievementRewardAssets[0]).toMatchObject({
      deletedAt: null
    });
    expect(config.achievements[0]).toMatchObject({
      deletedAt: "2026-02-03T04:05:06.000Z"
    });
    expect(config.musicTrackSettings).toEqual([
      { id: "home-default", displayName: "Home Theme" }
    ]);
  });

  it("renders a deterministic ES module snapshot", () => {
    const rendered = renderAdminDefaultSnapshot(
      { siteSettings: [{ key: "homeTitle", value: "星炬学院围棋部" }] },
      { generatedAt: new Date("2026-07-06T00:00:00.000Z") }
    );

    expect(rendered).toContain("Generated from prisma/dev.db non-user admin configuration on 2026-07-06.");
    expect(rendered).toContain("export const ADMIN_DEFAULT_CONFIG = {");
    expect(rendered).toContain('"homeTitle"');
    expect(rendered.endsWith("\n")).toBe(true);
  });
});

function snapshotPrisma() {
  return {
    siteSetting: {
      findMany: async () => [{ key: "homeSubtitle", value: "SIGRIKAGO" }]
    },
    character: {
      findMany: async () => [{
        slug: "sigrika",
        name: "西格莉卡",
        description: "部长",
        portraitUrl: "/assets/sigrika_centered.webp",
        portraitSource: "url",
        acquisitionMethod: "初始获得",
        cvName: "璃音",
        cvUrl: "https://space.bilibili.com/68435776",
        source: "default",
        palette: "#ff9b4d",
        enabled: true,
        sortOrder: 0,
        skill: {
          effectType: "erase-point",
          name: "星辉符文",
          description: "抹除棋盘上指定交叉点。",
          uses: 1,
          freeTurn: true,
          targetRule: "empty-point",
          paramsJson: "{}",
          costType: "numeric",
          costValue: "3",
          systemMessage: "{player} uses {skill}",
          enabled: true
        }
      }]
    },
    decoration: {
      findMany: async () => [{
        slug: "papagan-peach-stone",
        name: "耙耙柑和水蜜桃",
        description: "吃过的人都说好！",
        imageUrl: "/assets/decorations/papagan-peach-stone-preview.png",
        source: "default",
        enabled: true,
        sortOrder: 201
      }]
    },
    shopItem: {
      findMany: async () => [{
        name: "耙耙柑和水蜜桃",
        category: "decoration",
        targetId: "papagan-peach-stone",
        itemTargetType: "self",
        stockQuantity: -1,
        priceCoins: 1000,
        discountPercent: 0,
        purchasable: true,
        enabled: true,
        sortOrder: 201,
        description: "吃过的人都说好！",
        imageUrl: "/assets/decorations/papagan-peach-stone-preview.png",
        illustName: "憨态喵",
        illustUrl: "https://space.bilibili.com/392815021",
        source: "default"
      }]
    },
    gachaPool: {
      findMany: async () => [{
        id: "pool-1",
        name: "Pool",
        description: "",
        enabled: true,
        permanent: false,
        startsAt: new Date("2026-01-02T03:04:05.000Z"),
        endsAt: null,
        singleDrawPrice: 50,
        tenDrawPrice: 500,
        featuredPrizeId: "prize-1",
        featuredPrizeIds: "[\"prize-1\"]",
        sortOrder: 0,
        prizes: [{
          id: "prize-1",
          type: "coins",
          targetId: "",
          quantity: 60,
          probabilityBasisPoints: 10000,
          enabled: true,
          name: "Coins",
          imageUrl: "",
          sortOrder: 0
        }]
      }]
    },
    achievementRewardAsset: {
      findMany: async () => [{
        id: "reward-1",
        type: "title",
        name: "Title",
        description: "",
        imageUrl: "",
        text: "Title",
        targetType: "",
        targetId: "",
        amount: 0,
        enabled: true,
        deletedAt: null,
        sortOrder: 0
      }]
    },
    achievement: {
      findMany: async () => [{
        id: "achievement-1",
        key: "achievement-key",
        name: "Achievement",
        content: "Win once",
        conditionType: "total_wins",
        conditionParams: "{\"value\":1}",
        rewardAssetId: "reward-1",
        enabled: false,
        deletedAt: new Date("2026-02-03T04:05:06.000Z"),
        sortOrder: 0
      }]
    },
    musicTrackSetting: {
      findMany: async () => [{ id: "home-default", displayName: "Home Theme" }]
    }
  };
}
