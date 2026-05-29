import { publicUser } from "./db.js";
import { canonicalCharacterId } from "../src/shared/characterAliases.js";
import {
  DENIA_CANDY_EFFECT_TEXT,
  parseItemEffects,
  RAINBOW_BEAN_CANDY_ID,
  serializeItemEffects,
  SIGRIKA_CANDY_EFFECT_TEXT
} from "./itemEffects.js";

export { parseItemEffects } from "./itemEffects.js";

export const ITEM_TARGET_TYPES = new Set(["self", "character"]);

export function parseOwnedItems(value) {
  const text = String(value ?? "").trim();
  if (!text) return {};
  if (text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text);
      return normalizeOwnedItems(parsed);
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

export function normalizeOwnedItems(value) {
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

export function serializeOwnedItems(value) {
  return JSON.stringify(normalizeOwnedItems(value));
}

export function ownedItemsToPublic(value) {
  return Object.entries(parseOwnedItems(value)).map(([itemId, quantity]) => ({ itemId, quantity }));
}

export async function listItemInventory({ prisma, userId }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw routeError(404, "用户不存在");
  return { items: await inventoryPayload(prisma, user) };
}

export async function useInventoryItem({ prisma, userId, itemId, characterId = "" }) {
  return prisma.$transaction(async (tx) => {
    const [user, item] = await Promise.all([
      tx.user.findUnique({ where: { id: userId } }),
      tx.shopItem.findFirst({
        where: { category: "item", targetId: itemId, enabled: true }
      })
    ]);
    if (!user) throw routeError(404, "用户不存在");
    if (!item) throw routeError(404, "道具不存在");

    const ownedItems = parseOwnedItems(user.ownedItems);
    if ((ownedItems[item.targetId] ?? 0) <= 0) throw routeError(400, "未拥有该道具");

    const targetType = normalizeItemTargetType(item.itemTargetType);
    const targetCharacter = String(characterId ?? "").trim();
    if (targetType === "character") {
      if (!targetCharacter) throw routeError(400, "请选择角色");
      const ownedCharacters = String(user.ownedCharacters ?? "").split(",").map(canonicalCharacterId).filter(Boolean);
      if (!ownedCharacters.includes(canonicalCharacterId(targetCharacter))) throw routeError(403, "尚未获得该角色");
    }

    const effect = resolveItemEffect({ item, user, characterId: targetCharacter });
    ownedItems[item.targetId] -= 1;
    if (ownedItems[item.targetId] <= 0) delete ownedItems[item.targetId];
    const updated = await tx.user.update({
      where: { id: user.id },
      data: {
        ownedItems: serializeOwnedItems(ownedItems),
        ...effect.data
      }
    });
    return {
      user: publicUser(updated),
      items: await inventoryPayload(tx, updated),
      item: toItemPayload(item),
      effectText: effect.effectText,
      target: targetType === "character" ? { type: targetType, characterId: targetCharacter } : { type: targetType }
    };
  });
}

export function toItemPayload(item, quantity = 0) {
  const payload = toShopLikePayload(item);
  return {
    ...payload,
    itemId: payload.targetId,
    quantity,
    targetType: normalizeItemTargetType(payload.itemTargetType)
  };
}

function toShopLikePayload(item) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    targetId: item.targetId,
    itemTargetType: normalizeItemTargetType(item.itemTargetType),
    stockQuantity: item.stockQuantity ?? -1,
    priceCoins: item.priceCoins,
    discountPercent: item.discountPercent ?? 0,
    finalPrice: Math.max(0, Math.ceil(Number(item.priceCoins ?? 0) * (100 - Math.max(0, Math.min(100, Number(item.discountPercent ?? 0)))) / 100)),
    purchasable: item.purchasable,
    enabled: item.enabled,
    sortOrder: item.sortOrder ?? 0,
    description: item.description ?? "",
    imageUrl: item.imageUrl ?? ""
  };
}

export function normalizeItemTargetType(value) {
  return ITEM_TARGET_TYPES.has(value) ? value : "self";
}

async function inventoryPayload(prisma, user) {
  const counts = parseOwnedItems(user.ownedItems);
  const itemIds = Object.keys(counts);
  if (itemIds.length === 0) return [];
  const items = await prisma.shopItem.findMany({
    where: { category: "item", targetId: { in: itemIds } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
  return items.map((item) => toItemPayload(item, counts[item.targetId] ?? 0));
}

function parseNonNegativeInt(value) {
  if (typeof value === "number") return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value);
  return 0;
}

function resolveItemEffect({ item, user, characterId }) {
  if (item.targetId !== RAINBOW_BEAN_CANDY_ID) return { data: {}, effectText: "" };
  const targetCharacter = canonicalCharacterId(characterId);
  const itemEffects = parseItemEffects(user.itemEffects);
  if (targetCharacter === "sigrika") {
    if (itemEffects.sigrikaCandyDisabled) throw routeError(400, "西格莉卡已经处于糖果效果中");
    const selectedCharacter = canonicalCharacterId(user.selectedCharacter);
    const data = {
      itemEffects: serializeItemEffects({ ...itemEffects, sigrikaCandyDisabled: true }),
      coins: { increment: 30 }
    };
    if (selectedCharacter === "sigrika") {
      data.selectedCharacter = fallbackSelectedCharacter(user);
    }
    return { data, effectText: SIGRIKA_CANDY_EFFECT_TEXT };
  }
  if (targetCharacter === "denia") {
    if (itemEffects.deniaRainbowGlow) throw routeError(400, "达妮娅已经处于糖果效果中");
    return {
      data: {
        itemEffects: serializeItemEffects({ ...itemEffects, deniaRainbowGlow: true })
      },
      effectText: DENIA_CANDY_EFFECT_TEXT.replaceAll("{username}", user.username)
    };
  }
  throw routeError(400, "这个角色暂时没有糖果效果");
}

function fallbackSelectedCharacter(user) {
  const ownedCharacters = String(user.ownedCharacters ?? "")
    .split(",")
    .map(canonicalCharacterId)
    .filter((characterId) => characterId && characterId !== "sigrika");
  const fallback = ownedCharacters[0];
  if (!fallback) throw routeError(400, "没有可替换的出战角色");
  return ownedCharacters[Math.floor(Math.random() * ownedCharacters.length)] ?? fallback;
}

function routeError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
