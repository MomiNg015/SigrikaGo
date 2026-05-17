import { publicUser } from "./db.js";

const SHOP_CATEGORIES = new Set(["character", "decoration"]);
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
  }
];

export function finalShopPrice(item) {
  const discount = Math.max(0, Math.min(100, Number(item.discountPercent ?? 0)));
  return Math.max(0, Math.ceil(Number(item.priceCoins ?? 0) * (100 - discount) / 100));
}

export function toShopItemPayload(item) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    targetId: item.targetId,
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
  const priceCoins = parseNonNegativeInt(input.priceCoins);
  const discountPercent = parseNonNegativeInt(input.discountPercent ?? 0);
  const sortOrder = parseIntValue(input.sortOrder ?? 0);
  const purchasable = input.purchasable ?? true;
  const enabled = input.enabled ?? true;

  if (!name) errors.push("name is required");
  if (!SHOP_CATEGORIES.has(category)) errors.push("category must be character or decoration");
  if (!targetId) errors.push("targetId is required");
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

export async function listShopItems(prisma) {
  const items = await prisma.shopItem.findMany({
    where: { enabled: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
  return { items: items.map(toShopItemPayload) };
}

export async function seedBuiltinShopItems(prisma) {
  for (const item of BUILTIN_SHOP_ITEMS) {
    const existing = await prisma.shopItem.findFirst({
      where: {
        category: item.category,
        targetId: item.targetId
      }
    });
    if (existing) {
      await prisma.shopItem.update({
        where: { id: existing.id },
        data: item
      });
      continue;
    }
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
    } else {
      throw routeError(400, "未知商品类别");
    }

    const updated = await tx.user.update({ where: { id: user.id }, data });
    return { user: publicUser(updated), item: toShopItemPayload(item) };
  });
}

function listFromCsv(value) {
  return String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

function parseNonNegativeInt(value) {
  const number = parseIntValue(value);
  return number == null || number < 0 ? null : number;
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
