import { rankFromRating } from "../src/shared/ratingRank.js";
import { GAME_MODE_IDS } from "../src/shared/gameModes.js";
import { rankToStep } from "../src/shared/rankProgression.js";

export const RANK_STARS_MIGRATION_KEY = "migration.rank-stars-v1";

// Receipt and reset commit together. Keep the private receipt for audit/rollback.
export async function migrateRankStars(prisma) {
  if (!prisma?.$transaction || !prisma?.siteSetting?.findUnique) return;
  return prisma.$transaction(async (tx) => {
    if (await tx.siteSetting.findUnique({ where: { key: RANK_STARS_MIGRATION_KEY } })) return;
    const users = await tx.user.findMany({
      select: { id: true, rank: true, rating: true, stars: true, ownedCharacters: true, modeStats: true }
    });
    const achievements = await tx.achievement.findMany({ where: { conditionType: "rating" } });
    const persistedRooms = await tx.$queryRawUnsafe("SELECT code, snapshot FROM PersistedRoom WHERE status IN ('active', 'finished')");
    const rooms = persistedRooms.filter((row) => !JSON.parse(row.snapshot).recordSaved);
    await tx.siteSetting.create({ data: {
      key: RANK_STARS_MIGRATION_KEY,
      value: JSON.stringify({ version: 1, createdAt: new Date().toISOString(), users, achievements, rooms })
    } });
    for (const achievement of achievements) {
      const params = JSON.parse(achievement.conditionParams || "{}");
      const threshold = Number(params.value ?? params.count ?? 1);
      await tx.achievement.update({ where: { id: achievement.id }, data: {
        conditionType: "rank", conditionParams: JSON.stringify({ ...params, value: rankToStep(rankFromRating(threshold)) })
      } });
    }
    for (const row of rooms) {
      const snapshot = JSON.parse(row.snapshot);
      for (const player of snapshot.players ?? []) {
        if (!player.user || player.isBot || player.user.isBot) continue;
        Object.assign(player.user, { rank: "3段", stars: 2, rating: 0 });
        if (Array.isArray(player.user.modeStats)) {
          player.user.modeStats = player.user.modeStats.map((stats) => ({ ...stats, rank: "3段", stars: 2, rating: 0 }));
        } else {
          player.user.modeStats = Object.fromEntries(GAME_MODE_IDS.map((mode) => [mode, {
            ...(player.user.modeStats?.[mode] ?? {}), rank: "3段", stars: 2, rating: 0
          }]));
        }
      }
      await tx.$executeRawUnsafe("UPDATE PersistedRoom SET snapshot = ? WHERE code = ?", JSON.stringify(snapshot), row.code);
    }
    for (const user of users) {
      const owned = new Set(String(user.ownedCharacters ?? "").split(",").filter(Boolean));
      const spark = user.modeStats.find((stats) => stats.mode === "spark");
      if (user.rating >= 1400 || rankToStep(spark?.rank ?? user.rank) >= 6) owned.add("nabomo");
      if (owned.has("nabomo")) {
        await tx.userCharacter.upsert({
          where: { userId_characterSlug: { userId: user.id, characterSlug: "nabomo" } },
          create: { userId: user.id, characterSlug: "nabomo", source: "rank" }, update: {}
        });
      }
      await tx.user.update({ where: { id: user.id }, data: {
        rank: "3段", stars: 2, rating: 0, ownedCharacters: [...owned].join(",")
      } });
      for (const mode of GAME_MODE_IDS) {
        await tx.userModeStats.upsert({
          where: { userId_mode: { userId: user.id, mode } },
          create: { userId: user.id, mode, rank: "3段", stars: 2, rating: 0 },
          update: { rank: "3段", stars: 2, rating: 0 }
        });
      }
    }
  }, { timeout: 120000 });
}
