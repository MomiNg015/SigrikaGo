import { canonicalCharacterId } from "../src/shared/characterAliases.js";
import { MUSIC_TRACKS, parseMusicIds, serializeMusicIds } from "../src/shared/musicLibrary.js";
import { writeAudit } from "./adminAudit.js";
import { routeError } from "./adminRouteErrors.js";

export const ACHIEVEMENT_GAME_RECORD_SCAN_LIMIT = 10_000;
import { publicUser, USER_ASSET_RELATION_INCLUDE } from "./db.js";
import { parseItemEffects } from "./itemEffects.js";
import {
  parseAssetList,
  parseCharacterAssetList,
  parseOwnedItemCounts,
  serializeAssetList,
  serializeOwnedItemCounts,
  syncStructuredUserAssets
} from "./userAssets.js";

export const ACHIEVEMENT_REWARD_TYPES = {
  currency: "currency",
  title: "title",
  badge: "badge",
  nameplate: "nameplate",
  character: "character",
  decoration: "decoration",
  item: "item",
  music: "music"
};

export const ACHIEVEMENT_TRIGGER_EVENTS = {
  deniaRainbowBeanCandy: "denia-rainbow-bean-candy"
};

const DENIA_RAINBOW_BEAN_CANDY_REWARD_ID = "reward-denia-rainbow-bean-candy-coins";
const SIGRIKA_SPARK_100_WINS_REWARD_ID = "reward-sigrika-spark-100-wins-nameplate";
const DENIA_SPARK_100_WINS_REWARD_ID = "reward-denia-spark-100-wins-nameplate";
const BUILTIN_ACHIEVEMENT_REWARD_ASSETS = [{
  id: DENIA_RAINBOW_BEAN_CANDY_REWARD_ID,
  type: ACHIEVEMENT_REWARD_TYPES.currency,
  name: "你给我吃了什么！？奖励",
  description: "请达妮娅吃了彩虹豆豆跳跳糖",
  imageUrl: "",
  text: "100 金币",
  targetType: "coins",
  targetId: "",
  amount: 100,
  enabled: true,
  sortOrder: 100
}, {
  id: SIGRIKA_SPARK_100_WINS_REWARD_ID,
  type: ACHIEVEMENT_REWARD_TYPES.nameplate,
  name: "点亮语义！",
  description: "使用西格莉卡在星炬对弈中获得100胜",
  imageUrl: "/assets/achievements/semantic-nameplate.png",
  text: "用户名背景",
  targetType: "",
  targetId: "",
  amount: 0,
  enabled: true,
  sortOrder: 110
}, {
  id: DENIA_SPARK_100_WINS_REWARD_ID,
  type: ACHIEVEMENT_REWARD_TYPES.nameplate,
  name: "百次回响",
  description: "使用达妮娅在星炬对弈中获得100胜",
  imageUrl: "/assets/achievements/denia-spark-100-wins-nameplate.png",
  text: "用户名背景",
  targetType: "",
  targetId: "",
  amount: 0,
  enabled: true,
  sortOrder: 120
}];
const BUILTIN_ACHIEVEMENTS = [{
  id: "achievement-denia-rainbow-bean-candy",
  key: "denia-rainbow-bean-candy",
  name: "你给我吃了什么！？",
  content: "请达妮娅吃了彩虹豆豆跳跳糖",
  conditionType: "trigger_event",
  conditionParams: JSON.stringify({ event: ACHIEVEMENT_TRIGGER_EVENTS.deniaRainbowBeanCandy }),
  rewardAssetId: DENIA_RAINBOW_BEAN_CANDY_REWARD_ID,
  enabled: true,
  sortOrder: 100
}, {
  id: "achievement-sigrika-spark-100-wins",
  key: "sigrika-spark-100-wins",
  name: "点亮语义！",
  content: "使用西格莉卡在星炬对弈中获得100胜",
  conditionType: "mode_character_wins",
  conditionParams: JSON.stringify({ mode: "spark", characterId: "sigrika", value: 100 }),
  rewardAssetId: SIGRIKA_SPARK_100_WINS_REWARD_ID,
  enabled: true,
  sortOrder: 110
}, {
  id: "achievement-denia-spark-100-wins",
  key: "denia-spark-100-wins",
  name: "百次回响",
  content: "使用达妮娅在星炬对弈中获得100胜",
  conditionType: "mode_character_wins",
  conditionParams: JSON.stringify({ mode: "spark", characterId: "denia", value: 100 }),
  rewardAssetId: DENIA_SPARK_100_WINS_REWARD_ID,
  enabled: true,
  sortOrder: 120
}];

const REWARD_TYPES = new Set(Object.values(ACHIEVEMENT_REWARD_TYPES));
const EQUIPMENT_FIELDS = {
  title: "titleAssetId",
  badge: "badgeAssetId",
  nameplate: "nameplateAssetId"
};

export async function ensureAchievementSchema(client) {
  if (!client?.$executeRawUnsafe || !client?.$queryRawUnsafe) return;
  await addColumnIfMissing(client, "Character", "source", `TEXT NOT NULL DEFAULT 'default'`);
  await addColumnIfMissing(client, "Character", "cvName", `TEXT NOT NULL DEFAULT ''`);
  await addColumnIfMissing(client, "Character", "cvUrl", `TEXT NOT NULL DEFAULT ''`);
  await addColumnIfMissing(client, "Decoration", "source", `TEXT NOT NULL DEFAULT 'default'`);
  await addColumnIfMissing(client, "ShopItem", "source", `TEXT NOT NULL DEFAULT 'default'`);
  await addColumnIfMissing(client, "ShopItem", "illustName", `TEXT NOT NULL DEFAULT ''`);
  await addColumnIfMissing(client, "ShopItem", "illustUrl", `TEXT NOT NULL DEFAULT ''`);
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AchievementRewardAsset" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "type" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT NOT NULL DEFAULT '',
      "imageUrl" TEXT NOT NULL DEFAULT '',
      "text" TEXT NOT NULL DEFAULT '',
      "targetType" TEXT NOT NULL DEFAULT '',
      "targetId" TEXT NOT NULL DEFAULT '',
      "amount" INTEGER NOT NULL DEFAULT 0,
      "enabled" BOOLEAN NOT NULL DEFAULT true,
      "deletedAt" DATETIME,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Achievement" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "key" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "conditionType" TEXT NOT NULL,
      "conditionParams" TEXT NOT NULL DEFAULT '{}',
      "rewardAssetId" TEXT,
      "enabled" BOOLEAN NOT NULL DEFAULT true,
      "deletedAt" DATETIME,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Achievement_rewardAssetId_fkey" FOREIGN KEY ("rewardAssetId") REFERENCES "AchievementRewardAsset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserAchievement" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "achievementId" TEXT NOT NULL,
      "achievedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "rewardGrantedAt" DATETIME,
      CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AchievementCounter" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "metric" TEXT NOT NULL,
      "targetId" TEXT NOT NULL DEFAULT '',
      "value" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AchievementCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserAchievementEquipment" (
      "userId" TEXT NOT NULL PRIMARY KEY,
      "titleAssetId" TEXT NOT NULL DEFAULT '',
      "badgeAssetId" TEXT NOT NULL DEFAULT '',
      "nameplateAssetId" TEXT NOT NULL DEFAULT '',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "UserAchievementEquipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await client.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Achievement_key_key" ON "Achievement"("key")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Achievement_enabled_sortOrder_idx" ON "Achievement"("enabled", "sortOrder")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Achievement_conditionType_idx" ON "Achievement"("conditionType")`);
  await client.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UserAchievement_userId_achievedAt_idx" ON "UserAchievement"("userId", "achievedAt")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId")`);
  await client.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "AchievementCounter_userId_metric_targetId_key" ON "AchievementCounter"("userId", "metric", "targetId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AchievementCounter_metric_targetId_idx" ON "AchievementCounter"("metric", "targetId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AchievementRewardAsset_type_enabled_sortOrder_idx" ON "AchievementRewardAsset"("type", "enabled", "sortOrder")`);
}

export async function seedBuiltinAchievements(prisma) {
  if (!prisma?.achievementRewardAsset?.findUnique || !prisma?.achievement?.findUnique) return;
  for (const asset of BUILTIN_ACHIEVEMENT_REWARD_ASSETS) {
    const existing = await prisma.achievementRewardAsset.findUnique({ where: { id: asset.id } });
    if (existing) continue;
    await prisma.achievementRewardAsset.create({ data: asset });
  }
  const seededAchievements = [];
  for (const achievement of BUILTIN_ACHIEVEMENTS) {
    const existing = await prisma.achievement.findUnique({ where: { key: achievement.key } });
    if (existing) {
      seededAchievements.push(existing);
      continue;
    }
    const created = await prisma.achievement.create({ data: achievement });
    seededAchievements.push(created ?? achievement);
  }
  await grantBuiltinAchievementsToAdmins(prisma, seededAchievements);
}

async function grantBuiltinAchievementsToAdmins(prisma, achievements) {
  if (!achievements.length || !prisma?.user?.findMany || !prisma?.userAchievement?.findUnique || !prisma?.userAchievement?.create) return;
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true }
  });
  if (!admins.length) return;
  const achievedAt = new Date();
  for (const admin of admins) {
    for (const achievement of achievements) {
      const existing = await prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId: admin.id,
            achievementId: achievement.id
          }
        }
      });
      if (existing) continue;
      await prisma.userAchievement.create({
        data: {
          userId: admin.id,
          achievementId: achievement.id,
          achievedAt,
          rewardGrantedAt: achievedAt
        }
      });
    }
  }
}

export async function listAchievementsForUser({ prisma, userId }) {
  const unlocks = await evaluateAchievementsForUser({ prisma, userId });
  const [achievements, achievedRows] = await Promise.all([
    prisma.achievement.findMany({
      where: { enabled: true, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { rewardAsset: true }
    }),
    prisma.userAchievement.findMany({ where: { userId } })
  ]);
  const achievedMap = new Map(achievedRows.map((row) => [row.achievementId, row]));
  return {
    achievements: achievements.map((achievement) => toPlayerAchievementPayload(achievement, achievedMap.get(achievement.id))),
    unlocks
  };
}

export async function evaluateAchievementsForUser({ prisma, userId, triggerEvent = "" }) {
  if (!prisma?.achievement?.findMany || !prisma?.userAchievement?.findMany || !prisma?.user?.findUnique) return [];
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: USER_ASSET_RELATION_INCLUDE
  });
  if (!user) throw routeError(404, "User not found");

  const [achievements, existingRows, counters, gameRecords] = await Promise.all([
    prisma.achievement.findMany({
      where: { enabled: true, deletedAt: null },
      include: { rewardAsset: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    }),
    prisma.userAchievement.findMany({ where: { userId } }),
    prisma.achievementCounter.findMany({ where: { userId } }),
    prisma.gameRecord.findMany({
      where: { OR: [{ blackUserId: userId }, { whiteUserId: userId }] },
      select: {
        blackUserId: true,
        whiteUserId: true,
        blackCharacter: true,
        whiteCharacter: true,
        winnerColor: true,
        mode: true,
        resultText: true
      },
      orderBy: { createdAt: "desc" },
      take: ACHIEVEMENT_GAME_RECORD_SCAN_LIMIT
    })
  ]);
  const existing = new Map(existingRows.map((row) => [row.achievementId, row]));
  const metricContext = buildMetricContext({ user, counters, gameRecords, triggerEvent });
  const unlocks = [];
  for (const achievement of achievements) {
    const row = existing.get(achievement.id);
    if (row) {
      if (!row.rewardGrantedAt && achievement.rewardAsset) {
        await grantAchievementReward({ prisma, userId, achievement, userAchievementId: row.id });
      }
      continue;
    }
    if (!isAchievementMet(achievement, metricContext)) continue;
    const created = await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
        achievedAt: new Date()
      }
    });
    await grantAchievementReward({ prisma, userId, achievement, userAchievementId: created.id });
    unlocks.push(toUnlockPayload(achievement, created));
  }
  return unlocks;
}

export async function incrementAchievementCounter({ prisma, userId, metric, targetId = "", delta = 1 }) {
  if (!prisma?.achievementCounter?.upsert) return null;
  const normalizedMetric = String(metric ?? "").trim();
  if (!normalizedMetric) return null;
  return prisma.achievementCounter.upsert({
    where: { userId_metric_targetId: { userId, metric: normalizedMetric, targetId: String(targetId ?? "").trim() } },
    create: { userId, metric: normalizedMetric, targetId: String(targetId ?? "").trim(), value: Math.max(0, Number(delta) || 0) },
    update: { value: { increment: Math.max(0, Number(delta) || 0) } }
  });
}

export async function achievementStatsForUser({ prisma, userId }) {
  if (!prisma?.achievement?.count || !prisma?.userAchievement?.count) {
    return { achieved: 0, total: 0, percent: 0 };
  }
  const [total, achieved] = await Promise.all([
    prisma.achievement.count({ where: { enabled: true, deletedAt: null } }),
    prisma.userAchievement.count({
      where: {
        userId,
        achievement: { enabled: true, deletedAt: null }
      }
    })
  ]);
  return {
    achieved,
    total,
    percent: total > 0 ? Math.round((achieved / total) * 100) : 0
  };
}

export async function getAchievementEquipment({ prisma, userId }) {
  await evaluateAchievementsForUser({ prisma, userId });
  const [equipment, rewardAssets] = await Promise.all([
    readEquipment(prisma, userId),
    unlockedEquipmentAssets(prisma, userId)
  ]);
  const normalizedEquipment = normalizeEquipment(equipment);
  return {
    equipment: normalizedEquipment,
    equipmentAssets: selectedEquipmentAssets(rewardAssets, normalizedEquipment),
    assets: rewardAssets.map(toRewardAssetPayload)
  };
}

export async function attachAchievementEquipmentAssetsToUsers(prisma, users = []) {
  if (!Array.isArray(users) || users.length === 0) return users;
  const userIds = [...new Set(users.map((user) => user?.id).filter(Boolean))];
  if (!userIds.length) return users;

  const existingEquipment = new Map(users
    .filter((user) => user?.id)
    .map((user) => [user.id, normalizeEquipment(user.achievementEquipment)]));

  if (prisma?.userAchievementEquipment?.findMany) {
    const rows = await prisma.userAchievementEquipment.findMany({ where: { userId: { in: userIds } } });
    for (const row of rows) existingEquipment.set(row.userId, normalizeEquipment(row));
  }

  const assetIds = [...new Set([...existingEquipment.values()]
    .flatMap((equipment) => Object.values(equipment))
    .filter(Boolean))];
  let assets = [];
  if (assetIds.length && prisma?.achievementRewardAsset?.findMany) {
    assets = await prisma.achievementRewardAsset.findMany({
      where: {
        id: { in: assetIds },
        enabled: true,
        deletedAt: null
      }
    });
  }

  return users.map((user) => {
    if (!user?.id) return user;
    const equipment = existingEquipment.get(user.id) ?? normalizeEquipment(null);
    return {
      ...user,
      achievementEquipment: equipment,
      achievementEquipmentAssets: selectedEquipmentAssets(assets, equipment)
    };
  });
}

export async function updateAchievementEquipment({ prisma, userId, body }) {
  const assets = await unlockedEquipmentAssets(prisma, userId);
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  const next = {};
  for (const [type, field] of Object.entries(EQUIPMENT_FIELDS)) {
    const rawValue = String(body?.[field] ?? body?.[type] ?? "").trim();
    if (rawValue && byId.get(rawValue)?.type !== type) {
      throw routeError(400, `${type} asset is not unlocked`);
    }
    next[field] = rawValue;
  }
  const equipment = await prisma.userAchievementEquipment.upsert({
    where: { userId },
    create: { userId, ...next },
    update: next
  });
  const normalizedEquipment = normalizeEquipment(equipment);
  return {
    equipment: normalizedEquipment,
    equipmentAssets: selectedEquipmentAssets(assets, normalizedEquipment),
    assets: assets.map(toRewardAssetPayload)
  };
}

export async function listAdminAchievements({ prisma }) {
  const [achievements, rewardAssets] = await Promise.all([
    prisma.achievement.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { rewardAsset: true, _count: { select: { userAchievements: true } } }
    }),
    prisma.achievementRewardAsset.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    })
  ]);
  return {
    achievements: achievements.map(toAdminAchievementPayload),
    rewardAssets: rewardAssets.map(toRewardAssetPayload),
    conditionTypes: achievementConditionTypes(),
    triggerEvents: Object.values(ACHIEVEMENT_TRIGGER_EVENTS),
    rewardTypes: Object.values(ACHIEVEMENT_REWARD_TYPES)
  };
}

export async function createAchievement({ prisma, adminUser, body }) {
  const input = validateAchievementInput(body);
  await assertAchievementRewardExists(prisma, input.rewardAssetId);
  return prisma.$transaction(async (tx) => {
    const achievement = await tx.achievement.create({ data: input, include: { rewardAsset: true } });
    const payload = toAdminAchievementPayload(achievement);
    await writeAudit(tx, adminUser, "achievement.create", achievement.id, null, payload, "achievement");
    return { achievement: payload };
  });
}

export async function updateAchievement({ prisma, adminUser, achievementId, body }) {
  const input = validateAchievementEditableInput(body);
  if (Object.hasOwn(input, "rewardAssetId")) await assertAchievementRewardExists(prisma, input.rewardAssetId);
  return prisma.$transaction(async (tx) => {
    const before = await tx.achievement.findUnique({ where: { id: achievementId }, include: { rewardAsset: true } });
    if (!before) throw routeError(404, "Achievement not found");
    const after = await tx.achievement.update({ where: { id: achievementId }, data: input, include: { rewardAsset: true } });
    const payload = toAdminAchievementPayload(after);
    await writeAudit(tx, adminUser, "achievement.update", achievementId, toAdminAchievementPayload(before), payload, "achievement");
    return { achievement: payload };
  });
}

export async function disableAchievement({ prisma, adminUser, achievementId }) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.achievement.findUnique({ where: { id: achievementId }, include: { rewardAsset: true } });
    if (!before) throw routeError(404, "Achievement not found");
    const after = await tx.achievement.update({
      where: { id: achievementId },
      data: { enabled: false, deletedAt: new Date() },
      include: { rewardAsset: true }
    });
    const payload = toAdminAchievementPayload(after);
    await writeAudit(tx, adminUser, "achievement.disable", achievementId, toAdminAchievementPayload(before), payload, "achievement");
    return { achievement: payload };
  });
}

export async function createRewardAsset({ prisma, adminUser, body }) {
  const input = await validateRewardAssetInput(prisma, body);
  return prisma.$transaction(async (tx) => {
    const asset = await tx.achievementRewardAsset.create({ data: input });
    const payload = toRewardAssetPayload(asset);
    await writeAudit(tx, adminUser, "achievement-reward.create", asset.id, null, payload, "achievement-reward");
    return { rewardAsset: payload };
  });
}

export async function updateRewardAsset({ prisma, adminUser, rewardAssetId, body }) {
  const before = await prisma.achievementRewardAsset.findUnique({ where: { id: rewardAssetId } });
  if (!before) throw routeError(404, "Reward asset not found");
  const input = await validateRewardAssetInput(prisma, body, { partial: true, existing: before });
  return prisma.$transaction(async (tx) => {
    const after = await tx.achievementRewardAsset.update({ where: { id: rewardAssetId }, data: input });
    await writeAudit(tx, adminUser, "achievement-reward.update", rewardAssetId, toRewardAssetPayload(before), toRewardAssetPayload(after), "achievement-reward");
    return { rewardAsset: toRewardAssetPayload(after) };
  });
}

export async function disableRewardAsset({ prisma, adminUser, rewardAssetId }) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.achievementRewardAsset.findUnique({ where: { id: rewardAssetId } });
    if (!before) throw routeError(404, "Reward asset not found");
    const after = await tx.achievementRewardAsset.update({
      where: { id: rewardAssetId },
      data: { enabled: false, deletedAt: new Date() }
    });
    await writeAudit(tx, adminUser, "achievement-reward.disable", rewardAssetId, toRewardAssetPayload(before), toRewardAssetPayload(after), "achievement-reward");
    return { rewardAsset: toRewardAssetPayload(after) };
  });
}

async function grantAchievementReward({ prisma, userId, achievement, userAchievementId }) {
  const asset = achievement.rewardAsset;
  if (!asset || asset.enabled === false || asset.deletedAt) {
    await prisma.userAchievement.update({ where: { id: userAchievementId }, data: { rewardGrantedAt: new Date() } });
    return;
  }
  await prisma.$transaction(async (tx) => {
    const row = await tx.userAchievement.findUnique({ where: { id: userAchievementId } });
    if (!row || row.rewardGrantedAt) return;
    await applyRewardAsset(tx, userId, asset);
    await tx.userAchievement.update({ where: { id: userAchievementId }, data: { rewardGrantedAt: new Date() } });
  });
}

async function applyRewardAsset(tx, userId, asset) {
  const user = await tx.user.findUnique({ where: { id: userId } });
  if (!user) throw routeError(404, "User not found");
  if (asset.type === ACHIEVEMENT_REWARD_TYPES.currency) {
    const amount = Math.max(0, Number(asset.amount) || 0);
    const field = asset.targetType === "blueGems" ? "blueGems" : "coins";
    await tx.user.update({ where: { id: userId }, data: { [field]: { increment: amount } } });
    return;
  }
  if ([ACHIEVEMENT_REWARD_TYPES.title, ACHIEVEMENT_REWARD_TYPES.badge, ACHIEVEMENT_REWARD_TYPES.nameplate].includes(asset.type)) {
    return;
  }
  const data = {};
  if (asset.type === ACHIEVEMENT_REWARD_TYPES.character) {
    const targetId = canonicalCharacterId(asset.targetId);
    const owned = parseCharacterAssetList(user.ownedCharacters);
    if (!owned.includes(targetId)) data.ownedCharacters = serializeAssetList([...owned, targetId]);
  }
  if (asset.type === ACHIEVEMENT_REWARD_TYPES.decoration) {
    const owned = parseAssetList(user.ownedDecorations);
    if (!owned.includes(asset.targetId)) data.ownedDecorations = serializeAssetList([...owned, asset.targetId]);
  }
  if (asset.type === ACHIEVEMENT_REWARD_TYPES.item) {
    const owned = parseOwnedItemCounts(user.ownedItems);
    owned[asset.targetId] = (owned[asset.targetId] ?? 0) + Math.max(1, Number(asset.amount) || 1);
    data.ownedItems = serializeOwnedItemCounts(owned);
  }
  if (asset.type === ACHIEVEMENT_REWARD_TYPES.music) {
    const owned = parseMusicIds(user.ownedMusicIds);
    if (!owned.includes(asset.targetId)) data.ownedMusicIds = serializeMusicIds([...owned, asset.targetId]);
  }
  if (!Object.keys(data).length) return;
  const updated = await tx.user.update({ where: { id: userId }, data });
  await syncStructuredAchievementReward(tx, userId, asset);
  await syncStructuredUserAssets(tx, updated);
}

async function syncStructuredAchievementReward(tx, userId, asset) {
  if (asset.type === ACHIEVEMENT_REWARD_TYPES.character) {
    await tx.userCharacter?.upsert?.({
      where: { userId_characterSlug: { userId, characterSlug: canonicalCharacterId(asset.targetId) } },
      create: { userId, characterSlug: canonicalCharacterId(asset.targetId), source: "achievement" },
      update: { source: "achievement" }
    });
  }
  if (asset.type === ACHIEVEMENT_REWARD_TYPES.decoration) {
    await tx.userDecoration?.upsert?.({
      where: { userId_decorationSlug: { userId, decorationSlug: asset.targetId } },
      create: { userId, decorationSlug: asset.targetId, source: "achievement" },
      update: { source: "achievement" }
    });
  }
  if (asset.type === ACHIEVEMENT_REWARD_TYPES.item) {
    await tx.userItem?.upsert?.({
      where: { userId_itemId: { userId, itemId: asset.targetId } },
      create: { userId, itemId: asset.targetId, quantity: Math.max(1, Number(asset.amount) || 1), source: "achievement" },
      update: { quantity: { increment: Math.max(1, Number(asset.amount) || 1) }, source: "achievement" }
    });
  }
}

function buildMetricContext({ user, counters, gameRecords, triggerEvent }) {
  const counterValue = (metric, targetId = "") => counters.find((row) => row.metric === metric && row.targetId === targetId)?.value ?? 0;
  const modeStats = Array.isArray(user.modeStats) ? user.modeStats : [];
  const ownedCharacters = parseCharacterAssetList(user.ownedCharacters);
  const ownedDecorations = parseAssetList(user.ownedDecorations);
  const ownedItems = parseOwnedItemCounts(user.ownedItems);
  const ownedMusicIds = parseMusicIds(user.ownedMusicIds);
  const itemEffects = parseItemEffects(user.itemEffects);
  return {
    triggerEvent,
    counterValue,
    user,
    ownedCharacters,
    ownedDecorations,
    ownedItems,
    ownedMusicIds,
    itemEffects,
    totalGames: gameRecords.length,
    wins: gameRecords.filter((record) => didUserWinRecord(record, user.id)).length,
    modeStats,
    characterStats: characterStatsForRecords(gameRecords, user.id),
    modeCharacterStats: (mode) => characterStatsForRecords(
      gameRecords.filter((record) => (record.mode ?? "spark") === mode),
      user.id
    )
  };
}

function isAchievementMet(achievement, context) {
  const params = parseJsonObject(achievement.conditionParams);
  const threshold = Math.max(1, Number(params.value ?? params.count ?? 1) || 1);
  switch (achievement.conditionType) {
    case "total_games":
      return context.totalGames >= threshold;
    case "wins":
      return context.wins >= threshold;
    case "mode_games": {
      const stat = context.modeStats.find((row) => row.mode === params.mode);
      return Number(stat?.wins ?? 0) + Number(stat?.losses ?? 0) + Number(stat?.draws ?? 0) >= threshold;
    }
    case "mode_wins": {
      const stat = context.modeStats.find((row) => row.mode === params.mode);
      return Number(stat?.wins ?? 0) >= threshold;
    }
    case "rating":
      return Math.max(Number(context.user.rating ?? 0), ...context.modeStats.map((row) => Number(row.rating ?? 0))) >= threshold;
    case "owned_character_count":
      return context.ownedCharacters.length >= threshold;
    case "owned_decoration_count":
      return context.ownedDecorations.length >= threshold;
    case "owned_music_count":
      return context.ownedMusicIds.length >= threshold;
    case "owned_item_count":
      return Object.values(context.ownedItems).reduce((sum, count) => sum + Number(count ?? 0), 0) >= threshold;
    case "friend_count":
    case "login_days":
    case "purchase_count":
    case "gacha_draws":
      return context.counterValue(achievement.conditionType, params.targetId ?? "") >= threshold;
    case "character_games": {
      const stats = context.characterStats[canonicalCharacterId(params.characterId)] ?? { games: 0 };
      return stats.games >= threshold;
    }
    case "character_wins": {
      const stats = context.characterStats[canonicalCharacterId(params.characterId)] ?? { wins: 0 };
      return stats.wins >= threshold;
    }
    case "mode_character_wins": {
      const mode = String(params.mode ?? "spark");
      const stats = context.modeCharacterStats(mode)[canonicalCharacterId(params.characterId)] ?? { wins: 0 };
      return stats.wins >= threshold;
    }
    case "character_win_rate": {
      const stats = context.characterStats[canonicalCharacterId(params.characterId)] ?? { wins: 0, games: 0 };
      const minGames = Math.max(1, Number(params.minGames ?? threshold) || threshold);
      return stats.games >= minGames && stats.wins / stats.games >= Math.max(0, Number(params.rate ?? 0) || 0);
    }
    case "trigger_event":
      return context.triggerEvent && context.triggerEvent === params.event;
    case "item_effect":
      return Boolean(context.itemEffects[params.effectKey]);
    default:
      return false;
  }
}

function characterStatsForRecords(records, userId) {
  const stats = {};
  for (const record of records) {
    const characterId = canonicalCharacterId(record.blackUserId === userId ? record.blackCharacter : record.whiteCharacter);
    if (!characterId) continue;
    stats[characterId] ??= { games: 0, wins: 0 };
    stats[characterId].games += 1;
    if (didUserWinRecord(record, userId)) stats[characterId].wins += 1;
  }
  return stats;
}

function didUserWinRecord(record, userId) {
  if (!record.winnerColor) return false;
  return (record.winnerColor === "black" && record.blackUserId === userId)
    || (record.winnerColor === "white" && record.whiteUserId === userId);
}

function toPlayerAchievementPayload(achievement, row = null) {
  return {
    id: achievement.id,
    key: achievement.key,
    name: achievement.name,
    content: achievement.content,
    reward: achievement.rewardAsset ? toRewardAssetPayload(achievement.rewardAsset) : null,
    achieved: Boolean(row),
    achievedAt: row?.achievedAt ? new Date(row.achievedAt).toISOString() : null
  };
}

function toUnlockPayload(achievement, row) {
  return {
    id: achievement.id,
    key: achievement.key,
    name: achievement.name,
    content: achievement.content,
    achievedAt: row?.achievedAt ? new Date(row.achievedAt).toISOString() : new Date().toISOString(),
    reward: achievement.rewardAsset ? toRewardAssetPayload(achievement.rewardAsset) : null
  };
}

function toAdminAchievementPayload(achievement) {
  return {
    id: achievement.id,
    key: achievement.key,
    name: achievement.name,
    content: achievement.content,
    conditionType: achievement.conditionType,
    conditionParams: parseJsonObject(achievement.conditionParams),
    rewardAssetId: achievement.rewardAssetId ?? "",
    reward: achievement.rewardAsset ? toRewardAssetPayload(achievement.rewardAsset) : null,
    enabled: Boolean(achievement.enabled),
    deletedAt: achievement.deletedAt ? new Date(achievement.deletedAt).toISOString() : null,
    sortOrder: achievement.sortOrder ?? 0,
    achievedCount: achievement._count?.userAchievements ?? 0
  };
}

function toRewardAssetPayload(asset) {
  return {
    id: asset.id,
    type: asset.type,
    name: asset.name,
    description: asset.description ?? "",
    imageUrl: asset.imageUrl ?? "",
    text: asset.text ?? "",
    targetType: asset.targetType ?? "",
    targetId: asset.targetId ?? "",
    amount: Number(asset.amount ?? 0),
    enabled: asset.enabled !== false,
    deletedAt: asset.deletedAt ? new Date(asset.deletedAt).toISOString() : null,
    sortOrder: Number(asset.sortOrder ?? 0)
  };
}

function validateAchievementInput(body = {}, { partial = false } = {}) {
  const output = {};
  if (!partial || Object.hasOwn(body, "key")) {
    const key = String(body.key ?? "").trim();
    if (!/^[a-z0-9-]{2,64}$/.test(key)) throw routeError(400, "achievement key is invalid");
    output.key = key;
  }
  for (const field of ["name", "content", "conditionType"]) {
    if (!partial || Object.hasOwn(body, field)) {
      const value = String(body[field] ?? "").trim();
      if (!value) throw routeError(400, `${field} is required`);
      output[field] = value.slice(0, field === "content" ? 240 : 80);
    }
  }
  if (!partial || Object.hasOwn(body, "conditionParams")) {
    output.conditionParams = JSON.stringify(parseJsonObject(body.conditionParams));
  }
  if (!partial || Object.hasOwn(body, "rewardAssetId")) {
    output.rewardAssetId = String(body.rewardAssetId ?? "").trim() || null;
  }
  if (!partial || Object.hasOwn(body, "enabled")) output.enabled = body.enabled !== false;
  if (!partial || Object.hasOwn(body, "sortOrder")) output.sortOrder = parseIntValue(body.sortOrder ?? 0);
  return output;
}

function validateAchievementEditableInput(body = {}) {
  const output = {};
  const editableFields = new Set(["name", "content", "rewardAssetId", "sortOrder"]);
  for (const field of Object.keys(body ?? {})) {
    if (!editableFields.has(field)) throw routeError(400, `${field} is code-managed`);
  }
  for (const field of ["name", "content"]) {
    if (Object.hasOwn(body, field)) {
      const value = String(body[field] ?? "").trim();
      if (!value) throw routeError(400, `${field} is required`);
      output[field] = value.slice(0, field === "content" ? 240 : 80);
    }
  }
  if (Object.hasOwn(body, "rewardAssetId")) output.rewardAssetId = String(body.rewardAssetId ?? "").trim() || null;
  if (Object.hasOwn(body, "sortOrder")) output.sortOrder = parseIntValue(body.sortOrder ?? 0);
  if (!Object.keys(output).length) throw routeError(400, "No editable achievement fields");
  return output;
}

async function validateRewardAssetInput(prisma, body = {}, { partial = false, existing = null } = {}) {
  const output = {};
  if (!partial || Object.hasOwn(body, "type")) {
    const type = String(body.type ?? "").trim();
    if (!REWARD_TYPES.has(type)) throw routeError(400, "reward type is invalid");
    output.type = type;
  }
  if (!partial || Object.hasOwn(body, "name")) {
    const name = String(body.name ?? "").trim();
    if (!name) throw routeError(400, "reward name is required");
    output.name = name.slice(0, 80);
  }
  for (const field of ["description", "imageUrl", "text", "targetType", "targetId"]) {
    if (!partial || Object.hasOwn(body, field)) output[field] = String(body[field] ?? "").trim().slice(0, field === "description" ? 240 : 160);
  }
  if (!partial || Object.hasOwn(body, "amount")) output.amount = Math.max(0, parseIntValue(body.amount ?? 0));
  if (!partial || Object.hasOwn(body, "enabled")) output.enabled = body.enabled !== false;
  if (!partial || Object.hasOwn(body, "sortOrder")) output.sortOrder = parseIntValue(body.sortOrder ?? 0);
  const merged = partial ? { ...(existing ?? {}), ...output } : output;
  await assertRewardTargetExists(prisma, merged);
  return output;
}

async function assertRewardTargetExists(prisma, asset = {}) {
  if (![ACHIEVEMENT_REWARD_TYPES.character, ACHIEVEMENT_REWARD_TYPES.decoration, ACHIEVEMENT_REWARD_TYPES.item, ACHIEVEMENT_REWARD_TYPES.music].includes(asset.type)) return;
  if (!asset.targetId) throw routeError(400, "reward targetId is required");
  if (asset.type === ACHIEVEMENT_REWARD_TYPES.character) {
    const character = await prisma.character.findFirst({ where: { slug: canonicalCharacterId(asset.targetId), source: "achievement" } });
    if (!character) throw routeError(400, "Achievement character reward must target source=achievement");
  }
  if (asset.type === ACHIEVEMENT_REWARD_TYPES.decoration) {
    const decoration = await prisma.decoration.findFirst({ where: { slug: asset.targetId, source: "achievement" } });
    if (!decoration) throw routeError(400, "Achievement decoration reward must target source=achievement");
  }
  if (asset.type === ACHIEVEMENT_REWARD_TYPES.item) {
    const item = await prisma.shopItem.findFirst({ where: { category: "item", targetId: asset.targetId, source: "achievement" } });
    if (!item) throw routeError(400, "Achievement item reward must target source=achievement");
  }
  if (asset.type === ACHIEVEMENT_REWARD_TYPES.music && !MUSIC_TRACKS[asset.targetId]) {
    throw routeError(400, "Achievement music target does not exist");
  }
}

async function assertAchievementRewardExists(prisma, rewardAssetId) {
  if (!rewardAssetId) return;
  const asset = await prisma.achievementRewardAsset.findUnique({ where: { id: rewardAssetId } });
  if (!asset || asset.deletedAt) throw routeError(400, "Reward asset not found");
}

function achievementConditionTypes() {
  return [
    "total_games",
    "wins",
    "mode_games",
    "mode_wins",
    "rating",
    "owned_character_count",
    "owned_decoration_count",
    "owned_music_count",
    "owned_item_count",
    "friend_count",
    "login_days",
    "purchase_count",
    "gacha_draws",
    "character_games",
    "character_wins",
    "mode_character_wins",
    "character_win_rate",
    "trigger_event",
    "item_effect"
  ];
}

async function unlockedEquipmentAssets(prisma, userId) {
  const rows = await prisma.userAchievement.findMany({
    where: {
      userId,
      achievement: {
        rewardAsset: { type: { in: Object.keys(EQUIPMENT_FIELDS) } }
      }
    },
    include: { achievement: { include: { rewardAsset: true } } }
  });
  return rows
    .map((row) => row.achievement.rewardAsset)
    .filter((asset) => asset && asset.enabled !== false && !asset.deletedAt);
}

async function readEquipment(prisma, userId) {
  return prisma.userAchievementEquipment.findUnique({ where: { userId } });
}

function normalizeEquipment(equipment) {
  return {
    titleAssetId: equipment?.titleAssetId ?? "",
    badgeAssetId: equipment?.badgeAssetId ?? "",
    nameplateAssetId: equipment?.nameplateAssetId ?? ""
  };
}

function selectedEquipmentAssets(assets, equipment) {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  return Object.fromEntries(Object.entries(EQUIPMENT_FIELDS).map(([type, field]) => {
    const asset = byId.get(equipment[field]);
    return [type, asset ? toRewardAssetPayload(asset) : null];
  }));
}

function parseJsonObject(value) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function parseIntValue(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < -2147483648 || number > 2147483647) return 0;
  return number;
}

async function addColumnIfMissing(client, table, name, definition) {
  const columns = await client.$queryRawUnsafe(`PRAGMA table_info("${table}")`);
  if (!columns.some((column) => column.name === name)) {
    await client.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${name}" ${definition}`);
  }
}

export async function publicUserWithAchievementEquipment({ prisma, user }) {
  const [decoratedUsers, stats] = await Promise.all([
    attachAchievementEquipmentAssetsToUsers(prisma, [user]),
    achievementStatsForUser({ prisma, userId: user.id })
  ]);
  const decoratedUser = decoratedUsers[0] ?? user;
  const normalizedEquipment = normalizeEquipment(decoratedUser.achievementEquipment);
  return {
    ...publicUser(decoratedUser),
    achievementEquipment: normalizedEquipment,
    achievementEquipmentAssets: decoratedUser.achievementEquipmentAssets ?? selectedEquipmentAssets([], normalizedEquipment),
    achievementStats: stats
  };
}
