import { ensureAchievementSchema, seedBuiltinAchievements } from "./achievements.js";
import { ensureAnnouncementSchema } from "./announcements.js";
import { ensureOnboardingStorySchema } from "./onboardingStory.js";
import { ensureStoryScriptSchema, seedDefaultStoryScripts } from "./storyScripts.js";
import { seedCharacters } from "./characters.js";
import { ensureCostumeSchema } from "./costumes.js";
import { ensureGachaSchema, ensureGameModeSchema } from "./db.js";
import { ensureLoginSessionSchema } from "./loginSessions.js";
import { ensureMailboxSchema } from "./mailbox.js";
import { cleanupLegacyDeniaCharacterData } from "./legacyDeniaCleanup.js";
import { cleanupLegacyDerivedSkillLeak } from "./legacyDerivedSkillCleanup.js";
import { ensureMusicTrackSettingsSchema } from "./musicTracks.js";
import { ensureRecruitmentSchema } from "./recruitment.js";
import { ensureRoomPersistenceSchema } from "./roomPersistence.js";
import { seedBuiltinShopItems } from "./shop.js";
import { ensureDefaultSiteSettings } from "./siteSettings.js";
import { ensureSocialSchema } from "./social.js";
import { cleanupLegacyUsernames } from "./usernameCleanup.js";
import { seedAdminDefaultConfig } from "./adminDefaultSeed.js";
import { ensureSkillTraitSchema, migrateBuiltinSkillDescriptions } from "./skillTraits.js";
import { migrateLegacyAemeathOwnership } from "./aemeathAcquisition.js";
import { migrateBuiltinPortraitAssets } from "./builtinPortraitAssetMigration.js";

export const SERVER_SCHEMA_TASK_ORDER = Object.freeze([
  "ensureAchievementSchema",
  "ensureGachaSchema",
  "ensureMusicTrackSettingsSchema",
  "ensureRecruitmentSchema",
  "ensureAnnouncementSchema",
  "ensureStoryScriptSchema",
  "ensureOnboardingStorySchema",
  "ensureSkillTraitSchema",
  "ensureCostumeSchema",
  "ensureSocialSchema",
  "ensureRoomPersistenceSchema",
  "ensureLoginSessionSchema",
  "ensureGameModeSchema",
  "ensureMailboxSchema"
]);

export const SERVER_STARTUP_TASK_ORDER = Object.freeze([
  "ensureAchievementSchema",
  "ensureGachaSchema",
  "ensureMusicTrackSettingsSchema",
  "ensureRecruitmentSchema",
  "ensureAnnouncementSchema",
  "ensureStoryScriptSchema",
  "ensureOnboardingStorySchema",
  "ensureSkillTraitSchema",
  "ensureCostumeSchema",
  "migrateBuiltinPortraitAssets",
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

function createServerSchemaTasks({
  ensureAchievementSchema: ensureAchievementSchemaTask,
  ensureAnnouncementSchema: ensureAnnouncementSchemaTask,
  ensureCostumeSchema: ensureCostumeSchemaTask,
  ensureGachaSchema: ensureGachaSchemaTask,
  ensureGameModeSchema: ensureGameModeSchemaTask,
  ensureLoginSessionSchema: ensureLoginSessionSchemaTask,
  ensureMailboxSchema: ensureMailboxSchemaTask,
  ensureMusicTrackSettingsSchema: ensureMusicTrackSettingsSchemaTask,
  ensureOnboardingStorySchema: ensureOnboardingStorySchemaTask,
  ensureRecruitmentSchema: ensureRecruitmentSchemaTask,
  ensureRoomPersistenceSchema: ensureRoomPersistenceSchemaTask,
  ensureSkillTraitSchema: ensureSkillTraitSchemaTask,
  ensureSocialSchema: ensureSocialSchemaTask,
  ensureStoryScriptSchema: ensureStoryScriptSchemaTask
}) {
  return {
    ensureAchievementSchema: ensureAchievementSchemaTask,
    ensureAnnouncementSchema: ensureAnnouncementSchemaTask,
    ensureCostumeSchema: ensureCostumeSchemaTask,
    ensureGachaSchema: ensureGachaSchemaTask,
    ensureGameModeSchema: ensureGameModeSchemaTask,
    ensureLoginSessionSchema: ensureLoginSessionSchemaTask,
    ensureMailboxSchema: ensureMailboxSchemaTask,
    ensureMusicTrackSettingsSchema: ensureMusicTrackSettingsSchemaTask,
    ensureOnboardingStorySchema: ensureOnboardingStorySchemaTask,
    ensureRecruitmentSchema: ensureRecruitmentSchemaTask,
    ensureRoomPersistenceSchema: ensureRoomPersistenceSchemaTask,
    ensureSkillTraitSchema: ensureSkillTraitSchemaTask,
    ensureSocialSchema: ensureSocialSchemaTask,
    ensureStoryScriptSchema: ensureStoryScriptSchemaTask
  };
}

async function runTasksInOrder({ order, prisma, tasks }) {
  for (const taskName of order) {
    await tasks[taskName](prisma);
  }
}

export async function ensureServerSchema({
  prisma,
  ensureSocialSchema: ensureSocialSchemaTask = ensureSocialSchema,
  ensureRoomPersistenceSchema: ensureRoomPersistenceSchemaTask = ensureRoomPersistenceSchema,
  ensureLoginSessionSchema: ensureLoginSessionSchemaTask = ensureLoginSessionSchema,
  ensureGameModeSchema: ensureGameModeSchemaTask = ensureGameModeSchema,
  ensureGachaSchema: ensureGachaSchemaTask = ensureGachaSchema,
  ensureMailboxSchema: ensureMailboxSchemaTask = ensureMailboxSchema,
  ensureRecruitmentSchema: ensureRecruitmentSchemaTask = ensureRecruitmentSchema,
  ensureAnnouncementSchema: ensureAnnouncementSchemaTask = ensureAnnouncementSchema,
  ensureStoryScriptSchema: ensureStoryScriptSchemaTask = ensureStoryScriptSchema,
  ensureOnboardingStorySchema: ensureOnboardingStorySchemaTask = ensureOnboardingStorySchema,
  ensureSkillTraitSchema: ensureSkillTraitSchemaTask = ensureSkillTraitSchema,
  ensureCostumeSchema: ensureCostumeSchemaTask = ensureCostumeSchema,
  ensureMusicTrackSettingsSchema: ensureMusicTrackSettingsSchemaTask = ensureMusicTrackSettingsSchema,
  ensureAchievementSchema: ensureAchievementSchemaTask = ensureAchievementSchema
}) {
  const tasks = createServerSchemaTasks({
    ensureAchievementSchema: ensureAchievementSchemaTask,
    ensureAnnouncementSchema: ensureAnnouncementSchemaTask,
    ensureCostumeSchema: ensureCostumeSchemaTask,
    ensureGachaSchema: ensureGachaSchemaTask,
    ensureGameModeSchema: ensureGameModeSchemaTask,
    ensureLoginSessionSchema: ensureLoginSessionSchemaTask,
    ensureMailboxSchema: ensureMailboxSchemaTask,
    ensureMusicTrackSettingsSchema: ensureMusicTrackSettingsSchemaTask,
    ensureOnboardingStorySchema: ensureOnboardingStorySchemaTask,
    ensureRecruitmentSchema: ensureRecruitmentSchemaTask,
    ensureRoomPersistenceSchema: ensureRoomPersistenceSchemaTask,
    ensureSkillTraitSchema: ensureSkillTraitSchemaTask,
    ensureSocialSchema: ensureSocialSchemaTask,
    ensureStoryScriptSchema: ensureStoryScriptSchemaTask
  });

  await runTasksInOrder({ order: SERVER_SCHEMA_TASK_ORDER, prisma, tasks });
}

export async function initializeServerData({
  prisma,
  seedCharacters: seedCharactersTask = seedCharacters,
  seedBuiltinShopItems: seedBuiltinShopItemsTask = seedBuiltinShopItems,
  ensureDefaultSiteSettings: ensureDefaultSiteSettingsTask = ensureDefaultSiteSettings,
  ensureSocialSchema: ensureSocialSchemaTask = ensureSocialSchema,
  ensureRoomPersistenceSchema: ensureRoomPersistenceSchemaTask = ensureRoomPersistenceSchema,
  ensureLoginSessionSchema: ensureLoginSessionSchemaTask = ensureLoginSessionSchema,
  ensureGameModeSchema: ensureGameModeSchemaTask = ensureGameModeSchema,
  ensureGachaSchema: ensureGachaSchemaTask = ensureGachaSchema,
  ensureMailboxSchema: ensureMailboxSchemaTask = ensureMailboxSchema,
  ensureRecruitmentSchema: ensureRecruitmentSchemaTask = ensureRecruitmentSchema,
  ensureAnnouncementSchema: ensureAnnouncementSchemaTask = ensureAnnouncementSchema,
  ensureStoryScriptSchema: ensureStoryScriptSchemaTask = ensureStoryScriptSchema,
  ensureOnboardingStorySchema: ensureOnboardingStorySchemaTask = ensureOnboardingStorySchema,
  ensureSkillTraitSchema: ensureSkillTraitSchemaTask = ensureSkillTraitSchema,
  ensureCostumeSchema: ensureCostumeSchemaTask = ensureCostumeSchema,
  seedDefaultStoryScripts: seedDefaultStoryScriptsTask = seedDefaultStoryScripts,
  ensureMusicTrackSettingsSchema: ensureMusicTrackSettingsSchemaTask = ensureMusicTrackSettingsSchema,
  ensureAchievementSchema: ensureAchievementSchemaTask = ensureAchievementSchema,
  seedAdminDefaultConfig: seedAdminDefaultConfigTask = seedAdminDefaultConfig,
  migrateBuiltinPortraitAssets: migrateBuiltinPortraitAssetsTask = migrateBuiltinPortraitAssets,
  migrateLegacyAemeathOwnership: migrateLegacyAemeathOwnershipTask = migrateLegacyAemeathOwnership,
  seedBuiltinAchievements: seedBuiltinAchievementsTask = seedBuiltinAchievements,
  cleanupLegacyDeniaCharacterData: cleanupLegacyDeniaCharacterDataTask = cleanupLegacyDeniaCharacterData,
  cleanupLegacyDerivedSkillLeak: cleanupLegacyDerivedSkillLeakTask = cleanupLegacyDerivedSkillLeak,
  cleanupLegacyUsernames: cleanupLegacyUsernamesTask = cleanupLegacyUsernames,
  migrateBuiltinSkillDescriptions: migrateBuiltinSkillDescriptionsTask = migrateBuiltinSkillDescriptions
}) {
  const tasks = {
    cleanupLegacyDeniaCharacterData: cleanupLegacyDeniaCharacterDataTask,
    cleanupLegacyDerivedSkillLeak: cleanupLegacyDerivedSkillLeakTask,
    cleanupLegacyUsernames: cleanupLegacyUsernamesTask,
    ...createServerSchemaTasks({
      ensureAchievementSchema: ensureAchievementSchemaTask,
      ensureAnnouncementSchema: ensureAnnouncementSchemaTask,
      ensureCostumeSchema: ensureCostumeSchemaTask,
      ensureGachaSchema: ensureGachaSchemaTask,
      ensureGameModeSchema: ensureGameModeSchemaTask,
      ensureLoginSessionSchema: ensureLoginSessionSchemaTask,
      ensureMailboxSchema: ensureMailboxSchemaTask,
      ensureMusicTrackSettingsSchema: ensureMusicTrackSettingsSchemaTask,
      ensureOnboardingStorySchema: ensureOnboardingStorySchemaTask,
      ensureRecruitmentSchema: ensureRecruitmentSchemaTask,
      ensureRoomPersistenceSchema: ensureRoomPersistenceSchemaTask,
      ensureSkillTraitSchema: ensureSkillTraitSchemaTask,
      ensureSocialSchema: ensureSocialSchemaTask,
      ensureStoryScriptSchema: ensureStoryScriptSchemaTask
    }),
    ensureDefaultSiteSettings: ensureDefaultSiteSettingsTask,
    seedAdminDefaultConfig: seedAdminDefaultConfigTask,
    seedBuiltinAchievements: seedBuiltinAchievementsTask,
    seedBuiltinShopItems: seedBuiltinShopItemsTask,
    seedCharacters: seedCharactersTask,
    migrateBuiltinSkillDescriptions: migrateBuiltinSkillDescriptionsTask,
    migrateBuiltinPortraitAssets: migrateBuiltinPortraitAssetsTask,
    migrateLegacyAemeathOwnership: migrateLegacyAemeathOwnershipTask,
    seedDefaultStoryScripts: seedDefaultStoryScriptsTask
  };

  await runTasksInOrder({ order: SERVER_STARTUP_TASK_ORDER, prisma, tasks });
}
