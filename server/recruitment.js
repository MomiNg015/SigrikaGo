import { publicUser } from "./db.js";
import {
  DEFAULT_RECRUITMENT_CONFIG,
  RECRUITMENT_ITEMS,
  isRecruitmentItemType,
  recruitmentItemForType
} from "../src/shared/recruitment.js";
import {
  parseCharacterAssetList,
  parseOwnedItemCounts,
  publicUserAssets,
  serializeAssetList,
  serializeOwnedItemCounts,
  syncStructuredUserAssets
} from "./userAssets.js";
import { canUseDebugTestActions } from "./security.js";

const RECRUITMENT_CONFIG_KEY = "recruitmentConfig";
const ACTIVE_TASK_STATUSES = new Set(["pending"]);
const RECRUITMENT_FAST_FORWARD_REMAINING_MS = 5000;

export async function ensureRecruitmentSchema(client) {
  if (!client?.$executeRawUnsafe) return;
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "RecruitmentTask" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "itemType" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "resultType" TEXT NOT NULL,
      "resultCharacterSlug" TEXT,
      "successRatePercent" INTEGER NOT NULL,
      "missStreakAtStart" INTEGER NOT NULL DEFAULT 0,
      "responseText" TEXT NOT NULL DEFAULT '',
      "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "readyAt" DATETIME NOT NULL,
      "claimedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "RecruitmentTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RecruitmentTask_userId_status_readyAt_idx" ON "RecruitmentTask"("userId", "status", "readyAt")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RecruitmentTask_itemType_idx" ON "RecruitmentTask"("itemType")`);
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "RecruitmentMissStreak" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "itemType" TEXT NOT NULL,
      "streak" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "RecruitmentMissStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await client.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "RecruitmentMissStreak_userId_itemType_key" ON "RecruitmentMissStreak"("userId", "itemType")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RecruitmentMissStreak_itemType_idx" ON "RecruitmentMissStreak"("itemType")`);
}

export async function getRecruitmentStatus({ prisma, userId, now = new Date() }) {
  const [task, config, user] = await Promise.all([
    findActiveRecruitmentTask(prisma, userId),
    getRecruitmentConfig(prisma),
    findRecruitmentUser(prisma, userId)
  ]);
  if (!user) throw routeError(404, "用户不存在");
  const streaks = await listRecruitmentStreaks(prisma, userId);
  return {
    config: publicRecruitmentConfig(config),
    items: recruitmentItemsPayload({ user, streaks, config }),
    task: task ? toRecruitmentTaskPayload(task, { now, reveal: Boolean(task.claimedAt) }) : null
  };
}

export async function startRecruitment({ prisma, userId, itemType, now = new Date(), random = Math.random }) {
  const item = recruitmentItemForType(itemType);
  if (!item) throw routeError(400, "未知招募道具");

  return prisma.$transaction(async (tx) => {
    const [user, activeTask, config] = await Promise.all([
      findRecruitmentUser(tx, userId),
      findActiveRecruitmentTask(tx, userId),
      getRecruitmentConfig(tx)
    ]);
    if (!user) throw routeError(404, "用户不存在");
    if (activeTask) throw routeError(400, "现在只能同时进行一次招募");

    const ownedCharacters = publicUserAssets(user).ownedCharacters;
    const candidateIds = item.candidates.filter((candidateId) => !ownedCharacters.includes(candidateId));
    if (candidateIds.length === 0) {
      throw routeError(400, "好像已经没有可以用该道具招募的角色了");
    }

    const ownedItems = parseOwnedItemCounts(user.ownedItems);
    if ((ownedItems[item.itemType] ?? 0) <= 0) throw routeError(400, "还没有这个招募道具");
    ownedItems[item.itemType] -= 1;
    if (ownedItems[item.itemType] <= 0) delete ownedItems[item.itemType];

    const streak = await getRecruitmentStreak(tx, userId, item.itemType);
    const rate = rateForStreak(config, streak);
    const success = Number(random()) * 100 < rate;
    const pickedCharacter = success ? pickOne(candidateIds, random) : "";
    const responseText = success
      ? config.successTexts[pickedCharacter] || DEFAULT_RECRUITMENT_CONFIG.successTexts[pickedCharacter] || ""
      : pickOne(config.noResponseTexts[item.itemType] ?? DEFAULT_RECRUITMENT_CONFIG.noResponseTexts[item.itemType], random);
    const startedAt = new Date(now);
    const readyAt = new Date(startedAt.getTime() + config.durationMs);
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: { ownedItems: serializeOwnedItemCounts(ownedItems) }
    });
    await syncStructuredUserAssets(tx, updatedUser);

    const task = await tx.recruitmentTask.create({
      data: {
        userId,
        itemType: item.itemType,
        status: "pending",
        resultType: success ? "success" : "miss",
        resultCharacterSlug: pickedCharacter || null,
        successRatePercent: rate,
        missStreakAtStart: streak,
        responseText,
        startedAt,
        readyAt
      }
    });
    return {
      user: publicUser(updatedUser),
      task: toRecruitmentTaskPayload(task, { now: startedAt, reveal: false })
    };
  });
}

export async function claimRecruitment({ prisma, userId, now = new Date() }) {
  return prisma.$transaction(async (tx) => {
    const [user, task] = await Promise.all([
      findRecruitmentUser(tx, userId),
      findActiveRecruitmentTask(tx, userId)
    ]);
    if (!user) throw routeError(404, "用户不存在");
    if (!task) throw routeError(404, "没有待查看的招新回应");
    if (new Date(task.readyAt).getTime() > new Date(now).getTime()) {
      throw routeError(400, "招募还没有结束");
    }

    const data = {};
    if (task.resultType === "success" && task.resultCharacterSlug) {
      const ownedCharacters = publicUserAssets(user).ownedCharacters;
      if (!ownedCharacters.includes(task.resultCharacterSlug)) {
        const legacyOwnedCharacters = parseCharacterAssetList(user.ownedCharacters);
        data.ownedCharacters = serializeAssetList([...legacyOwnedCharacters, task.resultCharacterSlug]);
      }
    } else {
      const ownedItems = parseOwnedItemCounts(user.ownedItems);
      ownedItems[task.itemType] = (ownedItems[task.itemType] ?? 0) + 1;
      data.ownedItems = serializeOwnedItemCounts(ownedItems);
    }

    const updatedUser = Object.keys(data).length
      ? await tx.user.update({ where: { id: user.id }, data })
      : user;
    await syncStructuredUserAssets(tx, updatedUser);
    const claimedTask = await tx.recruitmentTask.update({
      where: { id: task.id },
      data: {
        status: "claimed",
        claimedAt: new Date(now)
      }
    });
    await setRecruitmentStreak(tx, userId, task.itemType, task.resultType === "success" ? 0 : task.missStreakAtStart + 1);
    return {
      user: publicUser(updatedUser),
      task: toRecruitmentTaskPayload(claimedTask, { now, reveal: true })
    };
  });
}

export async function fastForwardRecruitment({ prisma, userId, now = new Date(), env = process.env }) {
  if (!canUseDebugTestActions(env)) throw routeError(403, "测试工具仅开发环境可用");

  return prisma.$transaction(async (tx) => {
    const task = await findActiveRecruitmentTask(tx, userId);
    if (!task) throw routeError(404, "没有正在等待的招新回应");

    const targetReadyAt = new Date(new Date(now).getTime() + RECRUITMENT_FAST_FORWARD_REMAINING_MS);
    const currentReadyAt = new Date(task.readyAt);
    const nextReadyAt = currentReadyAt.getTime() > targetReadyAt.getTime() ? targetReadyAt : currentReadyAt;
    const updatedTask = nextReadyAt.getTime() === currentReadyAt.getTime()
      ? task
      : await tx.recruitmentTask.update({
        where: { id: task.id },
        data: { readyAt: nextReadyAt }
      });

    return {
      task: toRecruitmentTaskPayload(updatedTask, { now, reveal: false })
    };
  });
}

export async function getRecruitmentConfig(prisma) {
  const setting = await prisma.siteSetting?.findUnique?.({ where: { key: RECRUITMENT_CONFIG_KEY } });
  return normalizeRecruitmentConfig(setting?.value);
}

export async function updateRecruitmentConfig({ prisma, input }) {
  const config = normalizeRecruitmentConfig(input);
  await prisma.siteSetting.upsert({
    where: { key: RECRUITMENT_CONFIG_KEY },
    create: { key: RECRUITMENT_CONFIG_KEY, value: JSON.stringify(config) },
    update: { value: JSON.stringify(config) }
  });
  return { config: publicRecruitmentConfig(config) };
}

function publicRecruitmentConfig(config) {
  return {
    durationMs: config.durationMs,
    successRates: config.successRates,
    confidenceTexts: config.confidenceTexts
  };
}

function recruitmentItemsPayload({ user, streaks, config }) {
  const ownedItems = parseOwnedItemCounts(user.ownedItems);
  return Object.values(RECRUITMENT_ITEMS).map((item) => {
    const streak = streaks[item.itemType] ?? 0;
    const confidenceIndex = Math.min(streak, config.confidenceTexts.length - 1);
    return {
      itemType: item.itemType,
      name: item.name,
      scopeLabel: item.scopeLabel,
      description: item.description,
      imageUrl: item.imageUrl,
      quantity: ownedItems[item.itemType] ?? 0,
      confidenceText: config.confidenceTexts[confidenceIndex] ?? ""
    };
  });
}

function normalizeRecruitmentConfig(value) {
  const parsed = typeof value === "string" ? parseJson(value) : value;
  const fallback = DEFAULT_RECRUITMENT_CONFIG;
  const durationMs = clampInt(parsed?.durationMs, 30_000, 24 * 60 * 60 * 1000, fallback.durationMs);
  const successRates = normalizeRates(parsed?.successRates, fallback.successRates);
  return {
    durationMs,
    successRates,
    confidenceTexts: normalizeTextArray(parsed?.confidenceTexts, fallback.confidenceTexts, 3),
    noResponseTexts: Object.fromEntries(Object.keys(RECRUITMENT_ITEMS).map((itemType) => [
      itemType,
      normalizeTextArray(parsed?.noResponseTexts?.[itemType], fallback.noResponseTexts[itemType], 2)
    ])),
    successTexts: { ...fallback.successTexts, ...(parsed?.successTexts ?? {}) }
  };
}

function normalizeRates(value, fallback) {
  const raw = Array.isArray(value) ? value : fallback;
  const rates = raw.slice(0, 3).map((rate, index) => clampInt(rate, 0, 100, fallback[index] ?? 100));
  while (rates.length < 3) rates.push(fallback[rates.length] ?? rates.at(-1) ?? 100);
  for (let index = 1; index < rates.length; index += 1) {
    rates[index] = Math.max(rates[index], rates[index - 1]);
  }
  return rates;
}

function normalizeTextArray(value, fallback, length) {
  const raw = Array.isArray(value) ? value : fallback;
  const texts = raw.map((text) => String(text ?? "").trim()).filter(Boolean).slice(0, length);
  for (const text of fallback) {
    if (texts.length >= length) break;
    if (!texts.includes(text)) texts.push(text);
  }
  return texts;
}

function toRecruitmentTaskPayload(task, { now = new Date(), reveal = false } = {}) {
  const ready = new Date(task.readyAt).getTime() <= new Date(now).getTime();
  return {
    id: task.id,
    itemType: task.itemType,
    itemName: recruitmentItemForType(task.itemType)?.name ?? task.itemType,
    itemImageUrl: recruitmentItemForType(task.itemType)?.imageUrl ?? "",
    status: task.claimedAt ? "claimed" : ready ? "ready" : "pending",
    startedAt: task.startedAt,
    readyAt: task.readyAt,
    remainingMs: Math.max(0, new Date(task.readyAt).getTime() - new Date(now).getTime()),
    result: reveal ? {
      type: task.resultType,
      characterId: task.resultCharacterSlug ?? "",
      text: task.responseText
    } : null
  };
}

async function findActiveRecruitmentTask(prisma, userId) {
  return prisma.recruitmentTask.findFirst({
    where: {
      userId,
      status: { in: [...ACTIVE_TASK_STATUSES] },
      claimedAt: null
    },
    orderBy: { startedAt: "desc" }
  });
}

async function findRecruitmentUser(prisma, userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { userCharacters: true }
  });
}

async function listRecruitmentStreaks(prisma, userId) {
  const rows = await prisma.recruitmentMissStreak.findMany({ where: { userId } });
  return Object.fromEntries(rows.map((row) => [row.itemType, Math.max(0, Number(row.streak ?? 0))]));
}

async function getRecruitmentStreak(prisma, userId, itemType) {
  const row = await prisma.recruitmentMissStreak.findUnique({
    where: { userId_itemType: { userId, itemType } }
  });
  return Math.max(0, Number(row?.streak ?? 0));
}

async function setRecruitmentStreak(prisma, userId, itemType, streak) {
  await prisma.recruitmentMissStreak.upsert({
    where: { userId_itemType: { userId, itemType } },
    create: { userId, itemType, streak },
    update: { streak }
  });
}

function rateForStreak(config, streak) {
  return config.successRates[Math.min(Math.max(0, streak), config.successRates.length - 1)] ?? 100;
}

function pickOne(items, random) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  return list[Math.floor(Number(random()) * list.length)] ?? list[0] ?? "";
}

function clampInt(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(number)));
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export function routeError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function isRecruitmentInventoryItem(itemType) {
  return isRecruitmentItemType(itemType);
}
