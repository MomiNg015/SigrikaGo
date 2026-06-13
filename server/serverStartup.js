import { promoteConfiguredAdmins } from "./adminConfig.js";
import { ensureAchievementSchema } from "./achievements.js";
import { seedCharacters } from "./characters.js";
import { ensureGachaSchema, ensureGameModeSchema } from "./db.js";
import { ensureLoginSessionSchema } from "./loginSessions.js";
import { ensureMusicTrackSettingsSchema } from "./musicTracks.js";
import { ensureRoomPersistenceSchema } from "./roomPersistence.js";
import { seedBuiltinShopItems } from "./shop.js";
import { ensureDefaultSiteSettings } from "./siteSettings.js";
import { ensureSocialSchema } from "./social.js";

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
  ensureMusicTrackSettingsSchema: ensureMusicTrackSettingsSchemaTask = ensureMusicTrackSettingsSchema,
  ensureAchievementSchema: ensureAchievementSchemaTask = ensureAchievementSchema,
  promoteConfiguredAdmins: promoteConfiguredAdminsTask = promoteConfiguredAdmins
}) {
  await seedCharactersTask(prisma);
  await seedBuiltinShopItemsTask(prisma);
  await ensureDefaultSiteSettingsTask(prisma);
  await ensureSocialSchemaTask(prisma);
  await ensureRoomPersistenceSchemaTask(prisma);
  await ensureLoginSessionSchemaTask(prisma);
  await ensureGameModeSchemaTask(prisma);
  await ensureGachaSchemaTask(prisma);
  await ensureMusicTrackSettingsSchemaTask(prisma);
  await ensureAchievementSchemaTask(prisma);
  await promoteConfiguredAdminsTask(prisma);
}
