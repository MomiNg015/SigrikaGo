import { promoteConfiguredAdmins } from "./adminConfig.js";
import { ensureAchievementSchema, seedBuiltinAchievements } from "./achievements.js";
import { seedCharacters } from "./characters.js";
import { ensureGachaSchema, ensureGameModeSchema } from "./db.js";
import { ensureLoginSessionSchema } from "./loginSessions.js";
import { ensureMailboxSchema } from "./mailbox.js";
import { cleanupLegacyDeniaCharacterData } from "./legacyDeniaCleanup.js";
import { ensureMusicTrackSettingsSchema } from "./musicTracks.js";
import { ensureRecruitmentSchema } from "./recruitment.js";
import { ensureRoomPersistenceSchema } from "./roomPersistence.js";
import { seedBuiltinShopItems } from "./shop.js";
import { ensureDefaultSiteSettings } from "./siteSettings.js";
import { ensureSocialSchema } from "./social.js";
import { cleanupLegacyUsernames } from "./usernameCleanup.js";
import { seedAdminDefaultConfig } from "./adminDefaultSeed.js";

export const SERVER_STARTUP_TASK_ORDER = Object.freeze([
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
  ensureMusicTrackSettingsSchema: ensureMusicTrackSettingsSchemaTask = ensureMusicTrackSettingsSchema,
  ensureAchievementSchema: ensureAchievementSchemaTask = ensureAchievementSchema,
  seedAdminDefaultConfig: seedAdminDefaultConfigTask = seedAdminDefaultConfig,
  seedBuiltinAchievements: seedBuiltinAchievementsTask = seedBuiltinAchievements,
  cleanupLegacyDeniaCharacterData: cleanupLegacyDeniaCharacterDataTask = cleanupLegacyDeniaCharacterData,
  cleanupLegacyUsernames: cleanupLegacyUsernamesTask = cleanupLegacyUsernames,
  promoteConfiguredAdmins: promoteConfiguredAdminsTask = promoteConfiguredAdmins
}) {
  const tasks = {
    cleanupLegacyDeniaCharacterData: cleanupLegacyDeniaCharacterDataTask,
    cleanupLegacyUsernames: cleanupLegacyUsernamesTask,
    ensureAchievementSchema: ensureAchievementSchemaTask,
    ensureDefaultSiteSettings: ensureDefaultSiteSettingsTask,
    ensureGachaSchema: ensureGachaSchemaTask,
    ensureGameModeSchema: ensureGameModeSchemaTask,
    ensureLoginSessionSchema: ensureLoginSessionSchemaTask,
    ensureMailboxSchema: ensureMailboxSchemaTask,
    ensureMusicTrackSettingsSchema: ensureMusicTrackSettingsSchemaTask,
    ensureRecruitmentSchema: ensureRecruitmentSchemaTask,
    ensureRoomPersistenceSchema: ensureRoomPersistenceSchemaTask,
    ensureSocialSchema: ensureSocialSchemaTask,
    promoteConfiguredAdmins: promoteConfiguredAdminsTask,
    seedAdminDefaultConfig: seedAdminDefaultConfigTask,
    seedBuiltinAchievements: seedBuiltinAchievementsTask,
    seedBuiltinShopItems: seedBuiltinShopItemsTask,
    seedCharacters: seedCharactersTask
  };

  for (const taskName of SERVER_STARTUP_TASK_ORDER) {
    await tasks[taskName](prisma);
  }
}
