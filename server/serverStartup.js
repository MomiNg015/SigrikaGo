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
  await ensureAchievementSchemaTask(prisma);
  await ensureGachaSchemaTask(prisma);
  await ensureMusicTrackSettingsSchemaTask(prisma);
  await ensureRecruitmentSchemaTask(prisma);
  await seedAdminDefaultConfigTask(prisma);
  await seedBuiltinAchievementsTask(prisma);
  await cleanupLegacyDeniaCharacterDataTask(prisma);
  await cleanupLegacyUsernamesTask(prisma);
  await seedCharactersTask(prisma);
  await seedBuiltinShopItemsTask(prisma);
  await ensureDefaultSiteSettingsTask(prisma);
  await ensureSocialSchemaTask(prisma);
  await ensureRoomPersistenceSchemaTask(prisma);
  await ensureLoginSessionSchemaTask(prisma);
  await ensureGameModeSchemaTask(prisma);
  await ensureMailboxSchemaTask(prisma);
  await promoteConfiguredAdminsTask(prisma);
}
