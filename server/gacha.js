import { publicUser } from "./db.js";
import { parseAssetList, parseCharacterAssetList, parseOwnedItemCounts, serializeAssetList, serializeOwnedItemCounts } from "./userAssets.js";
import { PROGRESS_METRICS, PROGRESS_REASONS, progressLedgerCreateOperation } from "./userProgressLedger.js";
import { canonicalCharacterId } from "../src/shared/characterAliases.js";
import { parseMusicIds, serializeMusicIds } from "../src/shared/musicLibrary.js";

const GACHA_DRAW_COUNTS = new Set([1, 10]);
const PROBABILITY_TOTAL_BASIS_POINTS = 10000;

export const GACHA_REWARD_TYPES = {
  character: "character",
  decoration: "decoration",
  item: "item",
  music: "music",
  coins: "coins"
};

export function validatePrizeProbabilityTotal(prizes = []) {
  const totalBasisPoints = prizes
    .filter((prize) => prize.enabled !== false)
    .reduce((total, prize) => total + normalizedPositiveInt(prize.probabilityBasisPoints), 0);
  if (totalBasisPoints !== PROBABILITY_TOTAL_BASIS_POINTS) {
    return {
      ok: false,
      totalBasisPoints,
      error: "enabled prize probabilities must total 100%"
    };
  }
  return { ok: true, totalBasisPoints };
}

export async function listOpenGachaPools({ prisma, userId, now = new Date() }) {
  const [user, pools] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.gachaPool.findMany({
      where: { enabled: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { prizes: true }
    })
  ]);
  if (!user) throw routeError(404, "User not found");
  return {
    wallet: {
      coins: normalizedInt(user.coins),
      blueGems: normalizedInt(user.blueGems)
    },
    pools: pools
      .filter((pool) => isPoolOpen(pool, now))
      .map((pool) => toGachaPoolPayload(pool, now))
  };
}

export async function executeGachaDraw({ prisma, userId, poolId, count, now = new Date(), random = Math.random }) {
  const drawCount = normalizedPositiveInt(count);
  if (!GACHA_DRAW_COUNTS.has(drawCount)) throw routeError(400, "draw count must be 1 or 10");

  return prisma.$transaction(async (tx) => {
    const [user, pool] = await Promise.all([
      tx.user.findUnique({ where: { id: userId }, include: { userCharacters: true, userDecorations: true, userItems: true } }),
      tx.gachaPool.findUnique({ where: { id: poolId }, include: { prizes: true } })
    ]);
    if (!user) throw routeError(404, "User not found");
    if (!pool || pool.enabled === false) throw routeError(404, "Gacha pool not found");
    if (!isPoolOpen(pool, now)) throw routeError(400, "Gacha pool is not open");

    const enabledPrizes = (pool.prizes ?? []).filter((prize) => prize.enabled !== false);
    if (enabledPrizes.length === 0) throw routeError(400, "Gacha pool has no enabled prizes");
    const probability = validatePrizeProbabilityTotal(enabledPrizes);
    if (!probability.ok) throw routeError(400, probability.error);

    const coinCost = drawCount === 10
      ? normalizedPositiveInt(pool.tenDrawPrice)
      : normalizedPositiveInt(pool.singleDrawPrice);
    if (normalizedInt(user.coins) < coinCost) throw routeError(400, "Not enough coins");

    const state = mutableUserAssetState(user);
    state.coins -= coinCost;

    const rewards = [];
    for (let index = 0; index < drawCount; index += 1) {
      const prize = pickPrize(enabledPrizes, random);
      rewards.push(settlePrize(state, prize, index + 1));
    }

    const userUpdate = {
      coins: state.coins,
      blueGems: state.blueGems,
      ownedCharacters: serializeAssetList(state.ownedCharacters),
      ownedDecorations: serializeAssetList(state.ownedDecorations),
      ownedItems: serializeOwnedItemCounts(state.ownedItems),
      ownedMusicIds: serializeMusicIds(state.ownedMusicIds)
    };

    const updated = await tx.user.update({ where: { id: user.id }, data: userUpdate });
    await applyStructuredRewardOperations(tx, user.id, rewards);

    const draw = await tx.gachaDraw.create({
      data: {
        userId: user.id,
        poolId: pool.id,
        drawCount,
        coinCost,
        createdAt: now
      }
    });
    await tx.gachaDrawReward?.createMany?.({
      data: rewards.map((reward) => ({
        drawId: draw.id,
        poolId: pool.id,
        prizeId: reward.prizeId,
        drawIndex: reward.drawIndex,
        type: reward.type,
        targetId: reward.targetId,
        quantity: reward.quantity,
        unlockedQuantity: reward.unlockedQuantity,
        duplicateQuantity: reward.duplicateQuantity,
        blueGemsAdded: reward.blueGemsAdded,
        chainAdded: reward.chainAdded,
        coinsAdded: reward.coinsAdded
      }))
    });

    await progressLedgerCreateOperation(tx, {
      userId: user.id,
      metric: PROGRESS_METRICS.coins,
      delta: -coinCost,
      beforeValue: user.coins,
      afterValue: state.coins,
      reason: PROGRESS_REASONS.gachaDraw,
      refType: "gachaPool",
      refId: pool.id
    });

    return {
      draw: {
        id: draw.id,
        poolId: pool.id,
        drawCount,
        coinCost,
        createdAt: draw.createdAt ?? now
      },
      rewards,
      user: publicGachaUser({ ...user, ...updated }, state.characterChains)
    };
  });
}

export async function listGachaDrawHistory({ prisma, userId }) {
  const draws = await prisma.gachaDraw.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { rewards: true, pool: true }
  });
  return {
    records: draws.map((draw) => ({
      id: draw.id,
      poolId: draw.poolId,
      poolName: draw.pool?.name ?? "",
      drawCount: draw.drawCount,
      coinCost: draw.coinCost,
      createdAt: new Date(draw.createdAt).toISOString(),
      rewards: (draw.rewards ?? []).map((reward) => ({
        id: reward.id,
        type: reward.type,
        targetId: reward.targetId,
        quantity: reward.quantity,
        unlockedQuantity: reward.unlockedQuantity,
        duplicateQuantity: reward.duplicateQuantity,
        blueGemsAdded: reward.blueGemsAdded,
        chainAdded: reward.chainAdded,
        coinsAdded: reward.coinsAdded
      }))
    }))
  };
}

export function toGachaPoolPayload(pool, now = new Date()) {
  const prizes = pool.prizes ?? [];
  const featuredPrize = prizes.find((prize) => prize.id === pool.featuredPrizeId) ?? prizes[0] ?? null;
  return {
    id: pool.id,
    name: pool.name,
    description: pool.description ?? "",
    permanent: Boolean(pool.permanent),
    startsAt: pool.startsAt ? new Date(pool.startsAt).toISOString() : null,
    endsAt: pool.endsAt ? new Date(pool.endsAt).toISOString() : null,
    openDateRange: formatOpenDateRange(pool),
    remainingMs: remainingOpenMs(pool, now),
    singleDrawPrice: normalizedPositiveInt(pool.singleDrawPrice),
    tenDrawPrice: normalizedPositiveInt(pool.tenDrawPrice),
    featuredPrize: featuredPrize ? toPrizePayload(featuredPrize) : null,
    prizes: prizes.filter((prize) => prize.enabled !== false).map(toPrizePayload)
  };
}

export function isPoolOpen(pool, now = new Date()) {
  if (!pool || pool.enabled === false) return false;
  if (pool.permanent) return true;
  const time = new Date(now).getTime();
  const startsAt = pool.startsAt ? new Date(pool.startsAt).getTime() : -Infinity;
  const endsAt = pool.endsAt ? new Date(pool.endsAt).getTime() : Infinity;
  return time >= startsAt && time <= endsAt;
}

function mutableUserAssetState(user) {
  return {
    coins: normalizedInt(user.coins),
    blueGems: normalizedInt(user.blueGems),
    ownedCharacters: parseCharacterAssetList(user.ownedCharacters),
    ownedDecorations: parseAssetList(user.ownedDecorations),
    ownedItems: parseOwnedItemCounts(user.ownedItems),
    ownedMusicIds: parseMusicIds(user.ownedMusicIds),
    characterChains: characterChainMap(user)
  };
}

function settlePrize(state, prize, drawIndex) {
  const type = String(prize.type ?? "").trim();
  const targetId = String(prize.targetId ?? "").trim();
  const quantity = Math.max(1, normalizedPositiveInt(prize.quantity));
  const reward = {
    drawIndex,
    prizeId: prize.id,
    type,
    targetId,
    quantity,
    unlockedQuantity: 0,
    duplicateQuantity: 0,
    blueGemsAdded: 0,
    chainAdded: 0,
    coinsAdded: 0
  };

  if (type === GACHA_REWARD_TYPES.coins) {
    state.coins += quantity;
    reward.coinsAdded = quantity;
    return reward;
  }

  if (type === GACHA_REWARD_TYPES.item) {
    state.ownedItems[targetId] = (state.ownedItems[targetId] ?? 0) + quantity;
    reward.unlockedQuantity = quantity;
    return reward;
  }

  if (type === GACHA_REWARD_TYPES.character) {
    const characterId = canonicalCharacterId(targetId);
    reward.targetId = characterId;
    const alreadyOwned = state.ownedCharacters.includes(characterId);
    if (!alreadyOwned) {
      state.ownedCharacters.push(characterId);
      reward.unlockedQuantity = 1;
    }
    reward.duplicateQuantity = alreadyOwned ? quantity : Math.max(0, quantity - 1);
    if (reward.duplicateQuantity > 0) {
      state.characterChains[characterId] = (state.characterChains[characterId] ?? 0) + reward.duplicateQuantity;
      reward.chainAdded = reward.duplicateQuantity;
    }
    return reward;
  }

  if (type === GACHA_REWARD_TYPES.decoration) {
    const alreadyOwned = state.ownedDecorations.includes(targetId);
    if (!alreadyOwned) {
      state.ownedDecorations.push(targetId);
      reward.unlockedQuantity = 1;
    }
    reward.duplicateQuantity = alreadyOwned ? quantity : Math.max(0, quantity - 1);
    reward.blueGemsAdded = reward.duplicateQuantity;
    state.blueGems += reward.blueGemsAdded;
    return reward;
  }

  if (type === GACHA_REWARD_TYPES.music) {
    const alreadyOwned = state.ownedMusicIds.includes(targetId);
    if (!alreadyOwned) {
      state.ownedMusicIds.push(targetId);
      reward.unlockedQuantity = 1;
    }
    reward.duplicateQuantity = alreadyOwned ? quantity : Math.max(0, quantity - 1);
    reward.blueGemsAdded = reward.duplicateQuantity;
    state.blueGems += reward.blueGemsAdded;
    return reward;
  }

  throw routeError(400, "Unknown gacha prize type");
}

async function applyStructuredRewardOperations(tx, userId, rewards) {
  for (const reward of rewards) {
    if (reward.type === GACHA_REWARD_TYPES.character && reward.targetId) {
      await tx.userCharacter?.upsert?.({
        where: { userId_characterSlug: { userId, characterSlug: reward.targetId } },
        create: { userId, characterSlug: reward.targetId, chainCount: reward.chainAdded, source: "gacha" },
        update: reward.chainAdded > 0
          ? { chainCount: { increment: reward.chainAdded }, source: "gacha" }
          : { source: "gacha" }
      });
    }
    if (reward.type === GACHA_REWARD_TYPES.decoration && reward.unlockedQuantity > 0) {
      await tx.userDecoration?.upsert?.({
        where: { userId_decorationSlug: { userId, decorationSlug: reward.targetId } },
        create: { userId, decorationSlug: reward.targetId, source: "gacha" },
        update: { source: "gacha" }
      });
    }
    if (reward.type === GACHA_REWARD_TYPES.item && reward.targetId) {
      await tx.userItem?.upsert?.({
        where: { userId_itemId: { userId, itemId: reward.targetId } },
        create: { userId, itemId: reward.targetId, quantity: reward.quantity, source: "gacha" },
        update: { quantity: { increment: reward.quantity }, source: "gacha" }
      });
    }
  }
}

function pickPrize(prizes, random) {
  const roll = Math.floor(Math.max(0, Math.min(0.999999, Number(random()) || 0)) * PROBABILITY_TOTAL_BASIS_POINTS);
  let cursor = 0;
  for (const prize of prizes) {
    cursor += normalizedPositiveInt(prize.probabilityBasisPoints);
    if (roll < cursor) return prize;
  }
  return prizes.at(-1);
}

function publicGachaUser(user, characterChains) {
  return {
    ...publicUser(user),
    blueGems: normalizedInt(user.blueGems),
    characterChains
  };
}

function characterChainMap(user) {
  const chains = {};
  for (const row of user.userCharacters ?? []) {
    const characterId = canonicalCharacterId(row.characterSlug);
    const chainCount = normalizedInt(row.chainCount);
    if (characterId && chainCount > 0) chains[characterId] = chainCount;
  }
  return chains;
}

function toPrizePayload(prize) {
  return {
    id: prize.id,
    type: prize.type,
    targetId: prize.targetId,
    quantity: normalizedPositiveInt(prize.quantity),
    probabilityBasisPoints: normalizedPositiveInt(prize.probabilityBasisPoints),
    probabilityPercent: normalizedPositiveInt(prize.probabilityBasisPoints) / 100,
    name: prize.name ?? "",
    imageUrl: prize.imageUrl ?? ""
  };
}

function formatOpenDateRange(pool) {
  if (pool.permanent) return "permanent";
  return `${formatDatePart(pool.startsAt)}-${formatDatePart(pool.endsAt)}`;
}

function formatDatePart(value) {
  if (!value) return "";
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function remainingOpenMs(pool, now) {
  if (pool.permanent || !pool.endsAt) return null;
  return Math.max(0, new Date(pool.endsAt).getTime() - new Date(now).getTime());
}

function normalizedPositiveInt(value) {
  const number = normalizedInt(value);
  return number > 0 ? number : 0;
}

function normalizedInt(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : 0;
}

function routeError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
