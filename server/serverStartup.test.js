import { describe, expect, it, vi } from "vitest";
import { initializeServerData } from "./serverStartup.js";

describe("server startup", () => {
  it("runs startup data and schema tasks in dependency order", async () => {
    const calls = [];
    const prisma = {};
    const task = (name) => vi.fn(async (receivedPrisma) => {
      expect(receivedPrisma).toBe(prisma);
      calls.push(name);
    });
    const seedCharacters = task("seedCharacters");
    const seedBuiltinShopItems = task("seedBuiltinShopItems");
    const ensureDefaultSiteSettings = task("ensureDefaultSiteSettings");
    const ensureSocialSchema = task("ensureSocialSchema");
    const ensureRoomPersistenceSchema = task("ensureRoomPersistenceSchema");
    const ensureLoginSessionSchema = task("ensureLoginSessionSchema");
    const ensureGameModeSchema = task("ensureGameModeSchema");
    const ensureGachaSchema = task("ensureGachaSchema");
    const ensureMusicTrackSettingsSchema = task("ensureMusicTrackSettingsSchema");
    const ensureAchievementSchema = task("ensureAchievementSchema");
    const seedBuiltinAchievements = task("seedBuiltinAchievements");
    const promoteConfiguredAdmins = task("promoteConfiguredAdmins");

    await initializeServerData({
      prisma,
      seedCharacters,
      seedBuiltinShopItems,
      ensureDefaultSiteSettings,
      ensureSocialSchema,
      ensureRoomPersistenceSchema,
      ensureLoginSessionSchema,
      ensureGameModeSchema,
      ensureGachaSchema,
      ensureMusicTrackSettingsSchema,
      ensureAchievementSchema,
      seedBuiltinAchievements,
      promoteConfiguredAdmins
    });

    expect(calls).toEqual([
      "ensureAchievementSchema",
      "seedBuiltinAchievements",
      "seedCharacters",
      "seedBuiltinShopItems",
      "ensureDefaultSiteSettings",
      "ensureSocialSchema",
      "ensureRoomPersistenceSchema",
      "ensureLoginSessionSchema",
      "ensureGameModeSchema",
      "ensureGachaSchema",
      "ensureMusicTrackSettingsSchema",
      "promoteConfiguredAdmins"
    ]);
  });
});
