import { canonicalCharacterId } from "../src/shared/characterAliases.js";
import { DEFAULT_RANK, normalizeRank } from "../src/shared/rankProgression.js";
import { parseItemEffects } from "./itemEffects.js";

const AVAILABLE_CHARACTER_IDS = ["sigrika", "denia", "aemeath"];
const ADMIN_ONLY_CHARACTER_IDS = ["qiuyuan", "mornye", "changli", "chisa"];
const RATING_UNLOCKS = [
  { characterId: "nabomo", rating: 1400 }
];
const RANK_UNLOCKS = [];

export function parseAssetList(value, { normalize = (item) => item } = {}) {
  const rawItems = Array.isArray(value)
    ? value
    : String(value ?? "").split(",");
  const seen = new Set();
  const result = [];
  for (const rawItem of rawItems) {
    const item = normalize(String(rawItem ?? "").trim());
    if (!item || seen.has(item)) continue;
    seen.add(item);
    result.push(item);
  }
  return result;
}

export function parseCharacterAssetList(value) {
  return parseAssetList(value, { normalize: canonicalCharacterId });
}

export function serializeAssetList(value, options = {}) {
  return parseAssetList(value, options).join(",");
}

export function parseOwnedItemCounts(value) {
  const text = String(value ?? "").trim();
  if (Array.isArray(value)) return normalizeOwnedItemCounts(value);
  if (!text) return {};
  if (text.startsWith("{")) {
    try {
      return normalizeOwnedItemCounts(JSON.parse(text));
    } catch {
      return {};
    }
  }
  const counts = {};
  for (const itemId of text.split(",").map((item) => item.trim()).filter(Boolean)) {
    counts[itemId] = (counts[itemId] ?? 0) + 1;
  }
  return counts;
}

export function normalizeOwnedItemCounts(value) {
  const entries = Array.isArray(value)
    ? value.map((item) => [item?.itemId ?? item?.targetId ?? item?.id, item?.quantity])
    : Object.entries(value ?? {});
  const counts = {};
  for (const [rawId, rawQuantity] of entries) {
    const itemId = String(rawId ?? "").trim();
    const quantity = parseNonNegativeInt(rawQuantity);
    if (itemId && quantity > 0) counts[itemId] = quantity;
  }
  return counts;
}

export function serializeOwnedItemCounts(value) {
  return JSON.stringify(normalizeOwnedItemCounts(value));
}

export function legacyUserAssetsToStructuredRows(user) {
  const userId = String(user?.id ?? "").trim();
  if (!userId) {
    return {
      characters: [],
      decorations: [],
      items: [],
      itemEffects: []
    };
  }
  return {
    characters: parseCharacterAssetList(user.ownedCharacters).map((characterSlug) => ({
      userId,
      characterSlug,
      source: "legacy"
    })),
    decorations: parseAssetList(user.ownedDecorations).map((decorationSlug) => ({
      userId,
      decorationSlug,
      source: "legacy"
    })),
    items: Object.entries(parseOwnedItemCounts(user.ownedItems)).map(([itemId, quantity]) => ({
      userId,
      itemId,
      quantity,
      source: "legacy"
    })),
    itemEffects: Object.entries(parseLegacyItemEffects(user.itemEffects)).map(([effectKey, effectValue]) => ({
      userId,
      effectKey,
      effectValue,
      source: "legacy"
    }))
  };
}

export function publicUserAssets(user) {
  const ownedCharacters = new Set(publicOwnedCharacters(user));
  for (const characterId of AVAILABLE_CHARACTER_IDS) ownedCharacters.add(characterId);
  for (const unlock of RATING_UNLOCKS) {
    if ((user?.rating ?? 0) >= unlock.rating) ownedCharacters.add(unlock.characterId);
  }
  if (user?.role === "admin") {
    for (const characterId of ADMIN_ONLY_CHARACTER_IDS) ownedCharacters.add(characterId);
    for (const unlock of RANK_UNLOCKS) ownedCharacters.add(unlock.characterId);
  } else {
    const userRankStep = publicUserRankStep(user);
    for (const unlock of RANK_UNLOCKS) {
      if (userRankStep >= unlock.rankStep) ownedCharacters.add(unlock.characterId);
    }
  }
  return {
    selectedCharacter: canonicalCharacterId(user?.selectedCharacter),
    selectedStoneDecoration: user?.selectedStoneDecoration ?? "",
    ownedCharacters: [...ownedCharacters],
    ownedItems: publicOwnedItems(user),
    characterChains: publicCharacterChains(user),
    itemEffects: publicItemEffects(user),
    ownedDecorations: publicOwnedDecorations(user)
  };
}

export async function syncStructuredUserAssets(prisma, user) {
  if (!prisma || !user?.id) return;
  const operations = structuredUserAssetSyncOperations(prisma, user);
  if (operations.length === 0) return;
  await Promise.all(operations);
}

export function structuredUserAssetSyncOperations(prisma, user) {
  if (!prisma || !user?.id) return [];
  const rows = legacyUserAssetsToStructuredRows(user);
  return [
    prisma.userCharacter?.deleteMany?.({
      where: {
        userId: String(user.id),
        characterSlug: { notIn: rows.characters.map((row) => row.characterSlug) }
      }
    }),
    prisma.userDecoration?.deleteMany?.({
      where: {
        userId: String(user.id),
        decorationSlug: { notIn: rows.decorations.map((row) => row.decorationSlug) }
      }
    }),
    prisma.userItem?.deleteMany?.({
      where: {
        userId: String(user.id),
        itemId: { notIn: rows.items.map((row) => row.itemId) }
      }
    }),
    prisma.userItemEffect?.deleteMany?.({
      where: {
        userId: String(user.id),
        effectKey: { notIn: rows.itemEffects.map((row) => row.effectKey) }
      }
    }),
    ...rows.characters.map((row) => prisma.userCharacter?.upsert?.({
      where: { userId_characterSlug: { userId: row.userId, characterSlug: row.characterSlug } },
      create: row,
      update: { source: row.source }
    })),
    ...rows.decorations.map((row) => prisma.userDecoration?.upsert?.({
      where: { userId_decorationSlug: { userId: row.userId, decorationSlug: row.decorationSlug } },
      create: row,
      update: { source: row.source }
    })),
    ...rows.items.map((row) => prisma.userItem?.upsert?.({
      where: { userId_itemId: { userId: row.userId, itemId: row.itemId } },
      create: row,
      update: { quantity: row.quantity, source: row.source }
    })),
    ...rows.itemEffects.map((row) => prisma.userItemEffect?.upsert?.({
      where: { userId_effectKey: { userId: row.userId, effectKey: row.effectKey } },
      create: row,
      update: { effectValue: row.effectValue, source: row.source }
    }))
  ].filter(Boolean);
}

export function structuredUserItemEffectSyncOperations(prisma, user) {
  if (!prisma || !user?.id) return [];
  const userId = String(user.id);
  const rows = Object.entries(parseLegacyItemEffects(user.itemEffects)).map(([effectKey, effectValue]) => ({
    userId,
    effectKey,
    effectValue,
    source: "legacy"
  }));
  return [
    prisma.userItemEffect?.deleteMany?.({
      where: {
        userId,
        effectKey: { notIn: rows.map((row) => row.effectKey) }
      }
    }),
    ...rows.map((row) => prisma.userItemEffect?.upsert?.({
      where: { userId_effectKey: { userId: row.userId, effectKey: row.effectKey } },
      create: row,
      update: { effectValue: row.effectValue, source: row.source }
    }))
  ].filter(Boolean);
}

function parseLegacyItemEffects(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return normalizeItemEffectsMap(value);
  }
  const text = String(value ?? "").trim();
  if (!text || !text.startsWith("{")) return {};
  try {
    return normalizeItemEffectsMap(JSON.parse(text));
  } catch {
    return {};
  }
}

function publicOwnedCharacters(user) {
  const owned = new Set(parseCharacterAssetList(user?.ownedCharacters));
  if (Array.isArray(user?.userCharacters)) {
    for (const entry of user.userCharacters) {
      const characterId = canonicalCharacterId(entry.characterSlug);
      if (characterId) owned.add(characterId);
    }
  }
  return [...owned];
}

function publicUserRankStep(user) {
  const sparkStats = modeStatsRows(user?.modeStats).find((row) => row.mode === "spark");
  return rankToStep(normalizeRank(sparkStats?.rank ?? user?.rank ?? DEFAULT_RANK));
}

function rankToStep(rank) {
  const value = String(rank ?? "").trim();
  const danMatch = value.match(/^(\d+)段$/u);
  if (danMatch) return Number(danMatch[1]);
  const kyuMatch = value.match(/^(\d+)级$/u);
  if (kyuMatch) return -Number(kyuMatch[1]);
  return 3;
}

function modeStatsRows(modeStats) {
  if (Array.isArray(modeStats)) return modeStats;
  if (!modeStats || typeof modeStats !== "object") return [];
  return Object.entries(modeStats).map(([mode, stats]) => ({ mode, ...(stats ?? {}) }));
}

function publicCharacterChains(user) {
  const chains = {};
  for (const entry of user?.userCharacters ?? []) {
    const characterId = canonicalCharacterId(entry.characterSlug);
    const chainCount = Number(entry.chainCount ?? 0);
    if (characterId && Number.isFinite(chainCount) && chainCount > 0) {
      chains[characterId] = Math.floor(chainCount);
    }
  }
  return chains;
}

function publicOwnedDecorations(user) {
  const owned = new Set(parseAssetList(user?.ownedDecorations));
  if (Array.isArray(user?.userDecorations)) {
    for (const entry of user.userDecorations) {
      const decorationId = String(entry.decorationSlug ?? "").trim();
      if (decorationId) owned.add(decorationId);
    }
  }
  return [...owned];
}

function publicOwnedItems(user) {
  const counts = parseOwnedItemCounts(user?.ownedItems);
  if (Array.isArray(user?.userItems)) {
    for (const entry of user.userItems) {
      const itemId = String(entry.itemId ?? "").trim();
      const quantity = parseNonNegativeInt(entry.quantity);
      if (itemId && quantity > 0) counts[itemId] = Math.max(counts[itemId] ?? 0, quantity);
    }
  }
  return Object.entries(counts).map(([itemId, quantity]) => ({ itemId, quantity }));
}

function publicItemEffects(user) {
  const effects = parseItemEffects(user?.itemEffects);
  if (Array.isArray(user?.userItemEffects)) {
    for (const entry of user.userItemEffects) {
      const key = String(entry.effectKey ?? "").trim();
      const value = parseStructuredEffectValue(entry.effectValue);
      if (key && value !== false && value != null) effects[key] = value;
    }
  }
  return effects;
}

function normalizeItemEffectsMap(value) {
  return Object.fromEntries(
    Object.entries(value ?? {})
      .filter(([key, value]) => key && value !== false && value != null)
      .map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)])
  );
}

function parseStructuredEffectValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function parseNonNegativeInt(value) {
  if (typeof value === "number") return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value);
  return 0;
}
