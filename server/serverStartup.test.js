import { describe, expect, it, vi } from "vitest";
import { initializeServerData, SERVER_STARTUP_TASK_ORDER } from "./serverStartup.js";

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
    const ensureAnnouncementSchema = task("ensureAnnouncementSchema");
    const ensureStoryScriptSchema = task("ensureStoryScriptSchema");
    const ensureOnboardingStorySchema = task("ensureOnboardingStorySchema");
    const seedDefaultStoryScripts = task("seedDefaultStoryScripts");
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
      ensureAnnouncementSchema,
      ensureStoryScriptSchema,
      ensureOnboardingStorySchema,
      seedDefaultStoryScripts,
      ensureMusicTrackSettingsSchema,
      ensureAchievementSchema,
      seedAdminDefaultConfig,
      seedBuiltinAchievements,
      cleanupLegacyDeniaCharacterData,
      cleanupLegacyUsernames,
      promoteConfiguredAdmins
    });

    expect(SERVER_STARTUP_TASK_ORDER).toEqual([
      "ensureAchievementSchema",
      "ensureGachaSchema",
      "ensureMusicTrackSettingsSchema",
      "ensureRecruitmentSchema",
      "ensureAnnouncementSchema",
      "ensureStoryScriptSchema",
      "ensureOnboardingStorySchema",
      "seedDefaultStoryScripts",
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
    expect(calls).toEqual(SERVER_STARTUP_TASK_ORDER);
  });
});
