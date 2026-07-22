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
    const ensureSkillTraitSchema = task("ensureSkillTraitSchema");
    const seedDefaultStoryScripts = task("seedDefaultStoryScripts");
    const ensureMusicTrackSettingsSchema = task("ensureMusicTrackSettingsSchema");
    const ensureAchievementSchema = task("ensureAchievementSchema");
    const seedAdminDefaultConfig = task("seedAdminDefaultConfig");
    const migrateLegacyAemeathOwnership = task("migrateLegacyAemeathOwnership");
    const seedBuiltinAchievements = task("seedBuiltinAchievements");
    const cleanupLegacyDeniaCharacterData = task("cleanupLegacyDeniaCharacterData");
    const cleanupLegacyDerivedSkillLeak = task("cleanupLegacyDerivedSkillLeak");
    const cleanupLegacyUsernames = task("cleanupLegacyUsernames");
    const migrateBuiltinSkillDescriptions = task("migrateBuiltinSkillDescriptions");

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
      ensureSkillTraitSchema,
      seedDefaultStoryScripts,
      ensureMusicTrackSettingsSchema,
      ensureAchievementSchema,
      seedAdminDefaultConfig,
      migrateLegacyAemeathOwnership,
      seedBuiltinAchievements,
      cleanupLegacyDeniaCharacterData,
      cleanupLegacyDerivedSkillLeak,
      cleanupLegacyUsernames,
      migrateBuiltinSkillDescriptions
    });

    expect(SERVER_STARTUP_TASK_ORDER).toEqual([
      "ensureAchievementSchema",
      "ensureGachaSchema",
      "ensureMusicTrackSettingsSchema",
      "ensureRecruitmentSchema",
      "ensureAnnouncementSchema",
      "ensureStoryScriptSchema",
      "ensureOnboardingStorySchema",
      "ensureSkillTraitSchema",
      "seedAdminDefaultConfig",
      "migrateLegacyAemeathOwnership",
      "seedDefaultStoryScripts",
      "seedBuiltinAchievements",
      "cleanupLegacyDeniaCharacterData",
      "cleanupLegacyDerivedSkillLeak",
      "cleanupLegacyUsernames",
      "seedCharacters",
      "migrateBuiltinSkillDescriptions",
      "seedBuiltinShopItems",
      "ensureDefaultSiteSettings",
      "ensureSocialSchema",
      "ensureRoomPersistenceSchema",
      "ensureLoginSessionSchema",
      "ensureGameModeSchema",
      "ensureMailboxSchema"
    ]);
    expect(calls).toEqual(SERVER_STARTUP_TASK_ORDER);
  });
});
