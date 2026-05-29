import { publicUser } from "./db.js";
import { normalizeItemTargetType, parseOwnedItems, serializeOwnedItems } from "./items.js";
import { RAINBOW_BEAN_CANDY_ID } from "./itemEffects.js";
import { STONE_DECORATIONS } from "../src/shared/stoneDecorations.js";

const SHOP_CATEGORIES = new Set(["character", "decoration", "item"]);
const BUILTIN_SHOP_ITEMS = [
  {
    name: "猪小仙",
    category: "character",
    targetId: "baconbits",
    priceCoins: 9999,
    discountPercent: 0,
    purchasable: true,
    enabled: true,
    sortOrder: 100,
    description: "获得角色猪小仙。",
    imageUrl: "/assets/baconbits.png"
  },
  {
    name: "彩虹豆豆跳跳糖",
    category: "item",
    targetId: RAINBOW_BEAN_CANDY_ID,
    itemTargetType: "character",
    stockQuantity: 10,
    priceCoins: 10,
    discountPercent: 0,
    purchasable: true,
    enabled: true,
    sortOrder: 150,
    description: "产地不明的糖果，据说有神秘的效果",
    imageUrl: "/assets/items/rainbow-bean-candy.png"
  },
  ...Object.values(STONE_DECORATIONS).map((decoration, index) => ({
    name: decoration.name,
    category: "decoration",
    targetId: decoration.id,
    priceCoins: decoration.priceCoins,
    discountPercent: 0,
    purchasable: true,
    enabled: true,
    sortOrder: 200 + index,
    description: decoration.description,
    imageUrl: decoration.previewImageUrl
  }))
];

export function finalShopPrice(item) {
  const discount = Math.max(0, Math.min(100, Number(item.discountPercent ?? 0)));
  return Math.max(0, Math.ceil(Number(item.priceCoins ?? 0) * (100 - discount) / 100));
}

export function toShopItemPayload(item, purchaseCounts = {}) {
  const stockQuantity = item.stockQuantity ?? -1;
  const purchasedCount = Math.max(0, Number(purchaseCounts[item.targetId] ?? 0) || 0);
  const remainingStock = item.category === "item" && stockQuantity >= 0
    ? Math.max(0, stockQuantity - purchasedCount)
    : stockQuantity;
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    targetId: item.targetId,
    itemTargetType: normalizeItemTargetType(item.itemTargetType),
    stockQuantity,
    purchasedCount,
    remainingStock,
    priceCoins: item.priceCoins,
    discountPercent: item.discountPercent ?? 0,
    finalPrice: finalShopPrice(item),
    purchasable: item.purchasable,
    enabled: item.enabled,
    sortOrder: item.sortOrder ?? 0,
    description: item.description ?? "",
    imageUrl: item.imageUrl ?? ""
  };
}

export function validateShopItemInput(input = {}) {
  const errors = [];
  const name = String(input.name ?? "").trim();
  const category = String(input.category ?? "").trim();
  const targetId = String(input.targetId ?? "").trim();
  const itemTargetType = normalizeItemTargetType(input.itemTargetType);
  const stockQuantity = parseStockQuantity(input.stockQuantity ?? -1);
  const priceCoins = parseNonNegativeInt(input.priceCoins);
  const discountPercent = parseNonNegativeInt(input.discountPercent ?? 0);
  const sortOrder = parseIntValue(input.sortOrder ?? 0);
  const purchasable = input.purchasable ?? true;
  const enabled = input.enabled ?? true;

  if (!name) errors.push("name is required");
  if (!SHOP_CATEGORIES.has(category)) errors.push("category must be character, decoration, or item");
  if (!targetId) errors.push("targetId is required");
  if (stockQuantity == null) errors.push("stockQuantity must be -1 or a non-negative integer");
  if (priceCoins == null) errors.push("priceCoins must be a non-negative integer");
  if (discountPercent == null || discountPercent > 100) errors.push("discountPercent must be an integer from 0 to 100");
  if (sortOrder == null) errors.push("sortOrder must be an integer");
  if (typeof purchasable !== "boolean") errors.push("purchasable must be a boolean");
  if (typeof enabled !== "boolean") errors.push("enabled must be a boolean");
  if (errors.length) return { ok: false, error: errors.join("\n") };

  return {
    ok: true,
    value: {
      name,
      category,
      targetId,
      itemTargetType,
      stockQuantity,
      priceCoins,
      discountPercent,
      purchasable,
      enabled,
      sortOrder,
      description: String(input.description ?? "").trim(),
      imageUrl: String(input.imageUrl ?? "").trim()
    }
  };
}

export function validateDecorationInput(input = {}) {
  const errors = [];
  const slug = String(input.slug ?? "").trim();
  const name = String(input.name ?? "").trim();
  const sortOrder = parseIntValue(input.sortOrder ?? 0);
  const enabled = input.enabled ?? true;
  if (!/^[a-z0-9-]{2,40}$/.test(slug)) errors.push("slug must contain lowercase letters, numbers, or hyphens and be 2-40 characters");
  if (!name) errors.push("name is required");
  if (sortOrder == null) errors.push("sortOrder must be an integer");
  if (typeof enabled !== "boolean") errors.push("enabled must be a boolean");
  if (errors.length) return { ok: false, error: errors.join("\n") };
  return {
    ok: true,
    value: {
      slug,
      name,
      description: String(input.description ?? "").trim(),
      imageUrl: String(input.imageUrl ?? "").trim(),
      enabled,
      sortOrder
    }
  };
}

export async function listShopItems(prisma, userId = "") {
  const [items, user] = await Promise.all([
    prisma.shopItem.findMany({
      where: { enabled: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    }),
    userId ? prisma.user.findUnique({ where: { id: userId } }) : null
  ]);
  const purchaseCounts = parseItemPurchaseCounts(user?.itemPurchaseCounts);
  return { items: items.map((item) => toShopItemPayload(item, purchaseCounts)) };
}

export async function seedBuiltinShopItems(prisma) {
  for (const item of BUILTIN_SHOP_ITEMS) {
    const existing = await prisma.shopItem.findFirst({
      where: {
        category: item.category,
        targetId: item.targetId
      }
    });
    if (existing) continue;
    await prisma.shopItem.create({ data: item });
  }
}

export async function purchaseShopItem({ prisma, userId, itemId }) {
  return prisma.$transaction(async (tx) => {
    const [user, item] = await Promise.all([
      tx.user.findUnique({ where: { id: userId } }),
      tx.shopItem.findUnique({ where: { id: itemId } })
    ]);
    if (!user) throw routeError(404, "用户不存在");
    if (!item || !item.enabled || !item.purchasable) throw routeError(400, "商品不可购买");

    const itemPurchaseCounts = parseItemPurchaseCounts(user.itemPurchaseCounts);
    const purchasedCount = itemPurchaseCounts[item.targetId] ?? 0;
    if (item.category === "item" && item.stockQuantity >= 0 && purchasedCount >= item.stockQuantity) {
      throw routeError(400, "道具库存不足");
    }

    const price = finalShopPrice(item);
    if (user.coins < price) throw routeError(400, "金币不足");

    const ownedCharacters = listFromCsv(user.ownedCharacters);
    const ownedDecorations = listFromCsv(user.ownedDecorations);
    const data = { coins: user.coins - price };
    if (item.category === "character") {
      if (ownedCharacters.includes(item.targetId)) throw routeError(400, "已拥有该角色");
      data.ownedCharacters = [...ownedCharacters, item.targetId].join(",");
    } else if (item.category === "decoration") {
      if (ownedDecorations.includes(item.targetId)) throw routeError(400, "已拥有该装饰");
      data.ownedDecorations = [...ownedDecorations, item.targetId].join(",");
    } else if (item.category === "item") {
      const ownedItems = parseOwnedItems(user.ownedItems);
      ownedItems[item.targetId] = (ownedItems[item.targetId] ?? 0) + 1;
      itemPurchaseCounts[item.targetId] = purchasedCount + 1;
      data.ownedItems = serializeOwnedItems(ownedItems);
      data.itemPurchaseCounts = serializeItemPurchaseCounts(itemPurchaseCounts);
    } else {
      throw routeError(400, "未知商品类别");
    }

    const updated = await tx.user.update({ where: { id: user.id }, data });
    return { user: publicUser(updated), item: toShopItemPayload(item, itemPurchaseCounts) };
  });
}

export function parseItemPurchaseCounts(value) {
  const text = String(value ?? "").trim();
  if (!text) return {};
  if (text.startsWith("{")) {
    try {
      return normalizeCountObject(JSON.parse(text));
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

export function serializeItemPurchaseCounts(value = {}) {
  return JSON.stringify(normalizeCountObject(value));
}

function normalizeCountObject(value = {}) {
  return Object.fromEntries(
    Object.entries(value)
      .map(([itemId, quantity]) => [String(itemId).trim(), Math.max(0, Math.floor(Number(quantity) || 0))])
      .filter(([itemId, quantity]) => itemId && quantity > 0)
  );
}

function listFromCsv(value) {
  return String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

function parseNonNegativeInt(value) {
  const number = parseIntValue(value);
  return number == null || number < 0 ? null : number;
}

function parseStockQuantity(value) {
  const number = parseIntValue(value);
  return number == null || number < -1 ? null : number;
}

function parseIntValue(value) {
  if (typeof value === "number") return Number.isSafeInteger(value) ? value : null;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) return Number(value);
  return null;
}

function routeError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
