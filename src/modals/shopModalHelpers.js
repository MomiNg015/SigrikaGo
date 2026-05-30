export const SHOP_MASCOT_LINES = [
  "今天想买些什么？",
  "刚刚进了一批好货哟~",
  "欢迎来到扎希拉商店！"
];

export const SHOP_PAGE_SIZE = 8;

export function pickShopMascotLine(random = Math.random) {
  const value = Number(random());
  const index = Math.min(
    SHOP_MASCOT_LINES.length - 1,
    Math.max(0, Math.floor(value * SHOP_MASCOT_LINES.length))
  );
  return SHOP_MASCOT_LINES[index];
}

export function getShopPageCount(items = [], activeCategory = "character", pageSize = SHOP_PAGE_SIZE) {
  const visibleCount = Array.isArray(items) ? items.filter((item) => item.category === activeCategory).length : 0;
  return Math.max(1, Math.ceil(visibleCount / pageSize));
}

export function buildShopSlots(items = [], activeCategory = "character", page = 1, pageSize = SHOP_PAGE_SIZE) {
  const visibleItems = Array.isArray(items) ? items.filter((item) => item.category === activeCategory) : [];
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const safePage = Math.min(Math.max(Number(page) || 1, 1), pageCount);
  const start = (safePage - 1) * pageSize;
  return Array.from({ length: pageSize }, (_, index) => visibleItems[start + index] ?? null);
}

export function isShopItemOwned(item = {}, user = {}) {
  if (item.category === "character") return Boolean(user?.ownedCharacters?.includes(item.targetId));
  if (item.category === "decoration") return Boolean(user?.ownedDecorations?.includes(item.targetId));
  return false;
}

export function isShopItemSoldOut(item = {}) {
  return item.category === "item" && item.stockQuantity >= 0 && (item.remainingStock ?? item.stockQuantity) <= 0;
}

export function getShopItemDescription(item = {}) {
  return String(item.description ?? "").trim() || "暂无介绍";
}

export function getShopItemQuantityLabel(item = {}) {
  if (item.category === "item") {
    if (item.stockQuantity >= 0) return `库存 ${item.remainingStock ?? item.stockQuantity}`;
    return "不限量";
  }
  return "限购 1";
}
