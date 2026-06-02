import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SITE_SETTINGS } from "../src/shared/siteSettings.js";
import { ensureDefaultSiteSettings } from "./siteSettings.js";

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
  });
});
