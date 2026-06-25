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
    const ensureMailboxSchema = task("ensureMailboxSchema");
    const ensureRecruitmentSchema = task("ensureRecruitmentSchema");
    const ensureMusicTrackSettingsSchema = task("ensureMusicTrackSettingsSchema");
    const ensureAchievementSchema = task("ensureAchievementSchema");
    const seedAdminDefaultConfig = task("seedAdminDefaultConfig");
    const seedBuiltinAchievements = task("seedBuiltinAchievements");
    const cleanupLegacyDeniaCharacterData = task("cleanupLegacyDeniaCharacterData");
    const cleanupLegacyUsernames = task("cleanupLegacyUsernames");
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
      ensureMailboxSchema,
      ensureRecruitmentSchema,
      ensureMusicTrackSettingsSchema,
      ensureAchievementSchema,
      seedAdminDefaultConfig,
      seedBuiltinAchievements,
      cleanupLegacyDeniaCharacterData,
      cleanupLegacyUsernames,
      promoteConfiguredAdmins
    });

    expect(calls).toEqual([
      "ensureAchievementSchema",
      "ensureGachaSchema",
      "ensureMusicTrackSettingsSchema",
      "ensureRecruitmentSchema",
      "seedAdminDefaultConfig",
      "seedBuiltinAchievements",
      "cleanupLegacyDeniaCharacterData",
      "cleanupLegacyUsernames",
      "seedCharacters",
      "seedBuiltinShopItems",
      "ensureDefaultSiteSettings",
      "ensureSocialSchema",
      "ensureRoomPersistenceSchema",
      "ensureLoginSessionSchema",
      "ensureGameModeSchema",
      "ensureMailboxSchema",
      "promoteConfiguredAdmins"
    ]);
  });
});
