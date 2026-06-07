import { canonicalCharacterId } from "../src/shared/characterAliases.js";

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
    items: Object.entries(parseLegacyItemCounts(user.ownedItems)).map(([itemId, quantity]) => ({
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

function parseLegacyItemCounts(value) {
  const text = String(value ?? "").trim();
  if (!text) return {};
  if (text.startsWith("{")) {
    try {
      return normalizeCountMap(JSON.parse(text));
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

function normalizeCountMap(value) {
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

function parseLegacyItemEffects(value) {
  const text = String(value ?? "").trim();
  if (!text || !text.startsWith("{")) return {};
  try {
    const parsed = JSON.parse(text);
    return Object.fromEntries(
      Object.entries(parsed ?? {})
        .filter(([key, value]) => key && value !== false && value != null)
        .map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)])
    );
  } catch {
    return {};
  }
}

function parseNonNegativeInt(value) {
  if (typeof value === "number") return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value);
  return 0;
}
