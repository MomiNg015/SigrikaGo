import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SITE_SETTINGS } from "../src/shared/siteSettings.js";
import {
  ensureDefaultSiteSettings,
  sanitizeSiteSettings,
  updateSiteSettings
} from "./siteSettings.js";
import {
  DEFAULT_SHOP_MASCOT_DIALOGUES,
  shopMascotDialoguesSettingJson
} from "../src/shared/shopMascotDialogues.js";

describe("site settings defaults", () => {
  it("uses the academy brand as the production fallback title", () => {
    expect(DEFAULT_SITE_SETTINGS.homeTitle).toBe("星炬学院围棋部");
    expect(DEFAULT_SITE_SETTINGS.homeVersion).toBe("v0.1.0");
    expect(DEFAULT_SITE_SETTINGS.homeSubtitle).toBe("连罗伊人的都爱玩的智力游戏");
  });

  it("seeds missing site settings without overwriting configured values", async () => {
    const upsert = vi.fn();
    const prisma = {
      siteSetting: {
        upsert
      }
    };

    await ensureDefaultSiteSettings(prisma);

    expect(upsert).toHaveBeenCalledWith({
      where: { key: "homeTitle" },
      create: { key: "homeTitle", value: DEFAULT_SITE_SETTINGS.homeTitle },
      update: {}
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { key: "homeSubtitle" },
      create: { key: "homeSubtitle", value: DEFAULT_SITE_SETTINGS.homeSubtitle },
      update: {}
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { key: "homeVersion" },
      create: { key: "homeVersion", value: DEFAULT_SITE_SETTINGS.homeVersion },
      update: {}
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { key: "footerText" },
      create: { key: "footerText", value: DEFAULT_SITE_SETTINGS.footerText },
      update: {}
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { key: "preloadTips" },
      create: { key: "preloadTips", value: DEFAULT_SITE_SETTINGS.preloadTips },
      update: {}
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { key: "characterLoadingLines" },
      create: { key: "characterLoadingLines", value: DEFAULT_SITE_SETTINGS.characterLoadingLines },
      update: {}
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { key: "shopMascotDialogues" },
      create: { key: "shopMascotDialogues", value: DEFAULT_SITE_SETTINGS.shopMascotDialogues },
      update: {}
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { key: "irisGreeting" },
      create: { key: "irisGreeting", value: DEFAULT_SITE_SETTINGS.irisGreeting },
      update: {}
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { key: "irisLinks" },
      create: { key: "irisLinks", value: DEFAULT_SITE_SETTINGS.irisLinks },
      update: {}
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { key: "skillEffectsEnabled" },
      create: { key: "skillEffectsEnabled", value: "true" },
      update: {}
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { key: "ratingRules" },
      create: { key: "ratingRules", value: DEFAULT_SITE_SETTINGS.ratingRules },
      update: {}
    });
  });

  it("normalizes rating rules from admin settings input", () => {
    const settings = sanitizeSiteSettings({
      ...DEFAULT_SITE_SETTINGS,
      ratingRules: {
        elo: { kFactor: 999, deltaMin: 6, deltaMax: 10 },
        rankChangeRatingDelta: 100,
        rankGapAdjustment: { enabled: true, steps: [] },
        antiBoost: { enabled: true, reducedMultiplier: 0.25 },
        privateRewards: { winCoins: 20, lossCoins: 10, drawCoins: 10, dailyRewardLimit: 3 }
      }
    });

    const rules = JSON.parse(settings.ratingRules);
    expect(rules.elo.kFactor).toBe(80);
    expect(rules.elo.deltaMax).toBe(20);
    expect(rules.antiBoost.enabled).toBe(true);
    expect(rules.privateRewards.dailyRewardLimit).toBe(3);
  });

  it("normalizes the skill effects switch for storage", () => {
    expect(sanitizeSiteSettings({ ...DEFAULT_SITE_SETTINGS, skillEffectsEnabled: false }).skillEffectsEnabled).toBe("false");
    expect(sanitizeSiteSettings({ ...DEFAULT_SITE_SETTINGS, skillEffectsEnabled: "off" }).skillEffectsEnabled).toBe("false");
    expect(sanitizeSiteSettings({ ...DEFAULT_SITE_SETTINGS, skillEffectsEnabled: "on" }).skillEffectsEnabled).toBe("true");
  });

  it("preserves admin-configured character loading lines", () => {
    expect(sanitizeSiteSettings({
      ...DEFAULT_SITE_SETTINGS,
      characterLoadingLines: "sigrika=西格莉卡正在戳棋盘\nmornye=莫宁正在校准协议"
    }).characterLoadingLines).toBe("sigrika=西格莉卡正在戳棋盘\nmornye=莫宁正在校准协议");
  });

  it("trims and limits the configurable home version", () => {
    const settings = sanitizeSiteSettings({
      ...DEFAULT_SITE_SETTINGS,
      homeVersion: `  v${"1".repeat(40)}  `
    });

    expect(settings.homeVersion).toHaveLength(24);
    expect(settings.homeVersion).toBe(`v${"1".repeat(23)}`);
  });

  it("normalizes admin-configured IRIS links and rejects unsafe protocols", () => {
    const settings = sanitizeSiteSettings({
      ...DEFAULT_SITE_SETTINGS,
      irisLinks: [
        { title: "棋谱站", description: "公开棋谱", href: "https://example.com/kifu" },
        { title: "危险链接", description: "", href: "javascript:alert(1)" }
      ]
    });

    expect(JSON.parse(settings.irisLinks)).toEqual([
      {
        title: "棋谱站",
        description: "公开棋谱",
        href: "https://example.com/kifu",
        host: "example.com"
      }
    ]);
  });

  it("normalizes the IRIS greeting and falls back when it is blank", () => {
    expect(JSON.parse(sanitizeSiteSettings({
      ...DEFAULT_SITE_SETTINGS,
      irisGreeting: ["  今天\n也要认真复盘。 ", "欢迎回来。"]
    }).irisGreeting)).toEqual(["今天 也要认真复盘。", "欢迎回来。"]);
    expect(JSON.parse(sanitizeSiteSettings({
      ...DEFAULT_SITE_SETTINGS,
      irisGreeting: "   "
    }).irisGreeting)).toEqual(JSON.parse(DEFAULT_SITE_SETTINGS.irisGreeting));
  });

  it("normalizes shop mascot dialogue JSON at the backend boundary", () => {
    const settings = sanitizeSiteSettings({
      ...DEFAULT_SITE_SETTINGS,
      shopMascotDialogues: {
        zahira: {
          greetingLines: ["  新的\n欢迎语  "],
          thanksLine: "   "
        },
        nabomo: {
          greetingLines: ["娜波摩欢迎。"]
        }
      }
    });
    const dialogues = JSON.parse(settings.shopMascotDialogues);

    expect(dialogues.zahira.greetingLines).toEqual(["新的 欢迎语"]);
    expect(dialogues.zahira.thanksLine).toBe(DEFAULT_SHOP_MASCOT_DIALOGUES.zahira.thanksLine);
    expect(dialogues.nabomo.greetingLines).toEqual(["娜波摩欢迎。"]);
  });

  it("merges partial PATCH input over persisted settings before saving", async () => {
    const store = new Map([
      ["homeTitle", "已保存的大厅标题"],
      ["shopMascotDialogues", shopMascotDialoguesSettingJson()]
    ]);
    const tx = {
      siteSetting: {
        findMany: async () => [...store].map(([key, value]) => ({ key, value })),
        upsert: async ({ where, update }) => {
          store.set(where.key, update.value);
        }
      },
      adminAuditLog: {
        create: vi.fn()
      }
    };
    const prisma = {
      $transaction: async (callback) => callback(tx)
    };

    await updateSiteSettings({
      prisma,
      adminUser: { id: "admin-1" },
      body: { irisGreeting: "新的 IRIS 问候语" }
    });

    expect(store.get("homeTitle")).toBe("已保存的大厅标题");
    expect(JSON.parse(store.get("irisGreeting"))).toEqual(["新的 IRIS 问候语"]);
  });
});
