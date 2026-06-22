import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SITE_SETTINGS } from "../src/shared/siteSettings.js";
import { ensureDefaultSiteSettings, sanitizeSiteSettings } from "./siteSettings.js";

describe("site settings defaults", () => {
  it("uses the academy brand as the production fallback title", () => {
    expect(DEFAULT_SITE_SETTINGS.homeTitle).toBe("星炬学院围棋部");
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
});
