import { validatePrizeProbabilityTotal, GACHA_REWARD_TYPES, toGachaPoolPayload } from "./gacha.js";
import { getStoneDecoration } from "../src/shared/stoneDecorations.js";
import { MUSIC_TRACKS } from "../src/shared/musicLibrary.js";
import { routeError } from "./adminRouteErrors.js";
import { writeAudit } from "./adminAudit.js";
import { listMusicTrackMap } from "./musicTracks.js";

const GACHA_TYPES = new Set(Object.values(GACHA_REWARD_TYPES));

export function validateGachaPoolInput(input = {}) {
  const errors = [];
  const name = String(input.name ?? "").trim();
  const description = String(input.description ?? "").trim();
  const enabled = input.enabled ?? true;
  const permanent = input.permanent ?? false;
  const singleDrawPrice = parsePositiveInt(input.singleDrawPrice ?? 50);
  const tenDrawPrice = parsePositiveInt(input.tenDrawPrice ?? 500);
  const sortOrder = parseIntValue(input.sortOrder ?? 0);
  const startsAt = parseOptionalDate(input.startsAt);
  const endsAt = parseOptionalDate(input.endsAt);
  const rawPrizes = Array.isArray(input.prizes) ? input.prizes : [];

  if (!name) errors.push("name is required");
  if (typeof enabled !== "boolean") errors.push("enabled must be a boolean");
  if (typeof permanent !== "boolean") errors.push("permanent must be a boolean");
  if (singleDrawPrice == null) errors.push("singleDrawPrice must be a positive integer");
  if (tenDrawPrice == null) errors.push("tenDrawPrice must be a positive integer");
  if (sortOrder == null) errors.push("sortOrder must be an integer");
  if (!permanent && !startsAt) errors.push("startsAt is required when pool is not permanent");
  if (!permanent && !endsAt) errors.push("endsAt is required when pool is not permanent");
  if (startsAt === false || endsAt === false) errors.push("startsAt and endsAt must be valid dates");
  if (startsAt && endsAt && startsAt.getTime() >= endsAt.getTime()) errors.push("endsAt must be after startsAt");
  if (!rawPrizes.length) errors.push("at least one prize is required");

  const prizes = rawPrizes.map((prize, index) => validatePrizeInput(prize, index));
  for (const prize of prizes) {
    if (!prize.ok) errors.push(prize.error);
  }

  const valuePrizes = prizes.filter((prize) => prize.ok).map((prize) => prize.value);
  const probability = validatePrizeProbabilityTotal(valuePrizes);
  if (enabled && !probability.ok) errors.push(probability.error);

  const featuredPrizeIndexes = normalizeFeaturedPrizeIndexes(input);
  const featuredPrizeIndex = featuredPrizeIndexes[0] ?? null;
  if (featuredPrizeIndexes.some((index) => index < 0 || index >= valuePrizes.length)) {
    errors.push("featuredPrizeIndex must reference a prize");
  }

  if (errors.length) return { ok: false, error: errors.join("\n") };
  return {
    ok: true,
    value: {
      pool: {
        name,
        description,
        enabled,
        permanent,
        startsAt: permanent ? null : startsAt,
        endsAt: permanent ? null : endsAt,
        singleDrawPrice,
        tenDrawPrice,
        sortOrder
      },
      prizes: valuePrizes,
      featuredPrizeIndex,
      featuredPrizeIndexes
    }
  };
}

export async function listAdminGachaPools({ prisma }) {
  const [pools, musicTracks] = await Promise.all([
    prisma.gachaPool.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { prizes: true }
    }),
    listMusicTrackMap({ prisma })
  ]);
  return { pools: pools.map((pool) => toAdminGachaPoolPayload(pool, { musicTracks })) };
}

export async function assertGachaPrizeTargetsExist(prisma, input) {
  for (const prize of input.prizes ?? []) {
    if (prize.type === GACHA_REWARD_TYPES.coins) continue;
    if (prize.type === GACHA_REWARD_TYPES.character) {
      const character = await prisma.character.findUnique({ where: { slug: prize.targetId } });
      if (!character) throw routeError(400, "Gacha character target does not exist");
      continue;
    }
    if (prize.type === GACHA_REWARD_TYPES.decoration) {
      const decoration = await prisma.decoration.findUnique({ where: { slug: prize.targetId } });
      if (!decoration && !getStoneDecoration(prize.targetId)) {
        throw routeError(400, "Gacha decoration target does not exist");
      }
      continue;
    }
    if (prize.type === GACHA_REWARD_TYPES.item) {
      const item = await prisma.shopItem.findFirst({
        where: { category: "item", targetId: prize.targetId }
      });
      if (!item) throw routeError(400, "Gacha item target does not exist");
      continue;
    }
    if (prize.type === GACHA_REWARD_TYPES.music && !MUSIC_TRACKS[prize.targetId]) {
      throw routeError(400, "Gacha music target does not exist");
    }
  }
}

export async function createGachaPool({ prisma, adminUser, input }) {
  return prisma.$transaction(async (tx) => {
    const pool = await tx.gachaPool.create({ data: input.pool });
    const createdPrizes = [];
    for (const prize of input.prizes) {
      createdPrizes.push(await tx.gachaPrize.create({
        data: { ...prize, poolId: pool.id }
      }));
    }
    const featuredPrizeData = featuredPrizePersistenceData(input.featuredPrizeIndexes, createdPrizes);
    const afterPatch = await tx.gachaPool.update({ where: { id: pool.id }, data: featuredPrizeData });
    const after = { ...pool, ...afterPatch };
    const payload = toAdminGachaPoolPayload({ ...after, prizes: createdPrizes });
    await writeAudit(tx, adminUser, "gacha-pool.create", after.id, null, payload, "gacha-pool");
    return payload;
  });
}

export async function updateGachaPool({ prisma, adminUser, poolId, input }) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.gachaPool.findUnique({ where: { id: poolId }, include: { prizes: true } });
    if (!before) throw routeError(404, "Gacha pool not found");
    await tx.gachaPrize.deleteMany?.({ where: { poolId } });
    const updatedPool = await tx.gachaPool.update({
      where: { id: poolId },
      data: { ...input.pool, featuredPrizeId: null, featuredPrizeIds: null }
    });
    const createdPrizes = [];
    for (const prize of input.prizes) {
      createdPrizes.push(await tx.gachaPrize.create({
        data: { ...prize, poolId }
      }));
    }
    const featuredPrizeData = featuredPrizePersistenceData(input.featuredPrizeIndexes, createdPrizes);
    const afterPatch = await tx.gachaPool.update({ where: { id: poolId }, data: featuredPrizeData });
    const after = { ...updatedPool, ...afterPatch };
    const payload = toAdminGachaPoolPayload({ ...after, prizes: createdPrizes });
    await writeAudit(
      tx,
      adminUser,
      "gacha-pool.update",
      poolId,
      toAdminGachaPoolPayload(before),
      payload,
      "gacha-pool"
    );
    return payload;
  });
}

export async function disableGachaPool({ prisma, adminUser, poolId }) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.gachaPool.findUnique({ where: { id: poolId }, include: { prizes: true } });
    if (!before) throw routeError(404, "Gacha pool not found");
    const after = await tx.gachaPool.update({ where: { id: poolId }, data: { enabled: false } });
    const payload = toAdminGachaPoolPayload({ ...after, prizes: before.prizes ?? [] });
    await writeAudit(tx, adminUser, "gacha-pool.disable", poolId, toAdminGachaPoolPayload(before), payload, "gacha-pool");
    return payload;
  });
}

export function toAdminGachaPoolPayload(pool, { musicTracks = null } = {}) {
  return {
    ...toGachaPoolPayload(pool, new Date(), { musicTracks }),
    enabled: Boolean(pool.enabled),
    featuredPrizeId: pool.featuredPrizeId ?? null,
    featuredPrizeIds: featuredPrizeIdsFromPool(pool),
    sortOrder: pool.sortOrder ?? 0,
    prizes: (pool.prizes ?? []).map((prize) => ({
      id: prize.id,
      type: prize.type,
      targetId: prize.targetId,
      quantity: prize.quantity,
      probabilityBasisPoints: prize.probabilityBasisPoints,
      probabilityPercent: prize.probabilityBasisPoints / 100,
      enabled: prize.enabled,
      name: (prize.type === GACHA_REWARD_TYPES.music ? musicTracks?.[prize.targetId]?.name : "") || prize.name || "",
      imageUrl: prize.imageUrl ?? "",
      sortOrder: prize.sortOrder ?? 0
    }))
  };
}

function validatePrizeInput(input = {}, index) {
  const errors = [];
  const type = String(input.type ?? "").trim();
  const targetId = String(input.targetId ?? "").trim();
  const quantity = parsePositiveInt(input.quantity ?? 1);
  const probabilityBasisPoints = parseProbability(input.probabilityBasisPoints);
  const enabled = input.enabled ?? true;
  const sortOrder = parseIntValue(input.sortOrder ?? index);

  if (!GACHA_TYPES.has(type)) errors.push(`prizes[${index}].type is invalid`);
  if (type !== GACHA_REWARD_TYPES.coins && !targetId) errors.push(`prizes[${index}].targetId is required`);
  if (quantity == null) errors.push(`prizes[${index}].quantity must be a positive integer`);
  if (probabilityBasisPoints == null) errors.push(`prizes[${index}].probabilityBasisPoints must be 0-10000`);
  if (typeof enabled !== "boolean") errors.push(`prizes[${index}].enabled must be a boolean`);
  if (sortOrder == null) errors.push(`prizes[${index}].sortOrder must be an integer`);
  if (errors.length) return { ok: false, error: errors.join("\n") };

  return {
    ok: true,
    value: {
      type,
      targetId: type === GACHA_REWARD_TYPES.coins ? "" : targetId,
      quantity,
      probabilityBasisPoints,
      enabled,
      sortOrder,
      name: String(input.name ?? "").trim(),
      imageUrl: String(input.imageUrl ?? "").trim()
    }
  };
}

function parseOptionalDate(value) {
  if (value == null || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? false : date;
}

function parsePositiveInt(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0 || number > 2147483647) return null;
  return number;
}

function parseProbability(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 10000) return null;
  return number;
}

function parseIntValue(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < -2147483648 || number > 2147483647) return null;
  return number;
}

function normalizeFeaturedPrizeIndexes(input = {}) {
  const rawIndexes = Array.isArray(input.featuredPrizeIndexes)
    ? input.featuredPrizeIndexes
    : (input.featuredPrizeIndex == null || input.featuredPrizeIndex === "" ? [] : [input.featuredPrizeIndex]);
  const indexes = [];
  for (const rawIndex of rawIndexes) {
    const index = parseIntValue(rawIndex);
    if (index == null || indexes.includes(index)) continue;
    indexes.push(index);
  }
  return indexes;
}

function featuredPrizePersistenceData(featuredPrizeIndexes = [], prizes = []) {
  const ids = featuredPrizeIndexes
    .map((index) => prizes[index]?.id)
    .map((id) => String(id ?? "").trim())
    .filter(Boolean);
  return {
    featuredPrizeId: ids[0] ?? null,
    featuredPrizeIds: ids.length ? JSON.stringify(ids) : null
  };
}

function featuredPrizeIdsFromPool(pool = {}) {
  if (typeof pool.featuredPrizeIds === "string" && pool.featuredPrizeIds.trim()) {
    try {
      const parsed = JSON.parse(pool.featuredPrizeIds);
      if (Array.isArray(parsed)) return parsed.map((id) => String(id ?? "").trim()).filter(Boolean);
    } catch {
      return pool.featuredPrizeIds.split(",").map((id) => id.trim()).filter(Boolean);
    }
  }
  if (Array.isArray(pool.featuredPrizeIds)) {
    return pool.featuredPrizeIds.map((id) => String(id ?? "").trim()).filter(Boolean);
  }
  return pool.featuredPrizeId ? [pool.featuredPrizeId] : [];
}
