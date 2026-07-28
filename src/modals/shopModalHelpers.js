export const SHOP_MASCOT_LINES = [
  "今天想买些什么？",
  "刚刚进了一批好货哟~",
  "欢迎来到扎希拉商铺！"
];

export const SHOP_MASCOT_REFRESH_LINES = [
  "换一批看看吧，说不定会有惊喜哦。",
  "这批也是我精心挑选的呢。",
  "新到的商品已经摆好啦！"
];

export const SHOP_MASCOT_LOADING_LINE = "稍等一下，我正在整理商品哦。";
export const SHOP_MASCOT_EMPTY_LINE = "还在进货中哦，请下次再来吧。";
export const SHOP_MASCOT_ERROR_LINE = "进货单好像出了点问题，请再试一次吧。";
export const SHOP_BATCH_SIZE = 5;
export const SHOP_REFRESH_COOLDOWN_MS = 3000;

export const SHOP_ITEM_CATEGORY_LABELS = Object.freeze({
  character: "部员",
  item: "道具",
  decoration: "棋子",
  music: "音乐"
});

export {
  COSTUME_SHOP_BACKGROUND_IMAGE,
  COSTUME_SHOP_MOBILE_BACKGROUND_IMAGE,
  SHOP_BACKGROUND_IMAGE,
  SHOP_MASCOT_DEFAULT_IMAGE,
  SHOP_MASCOT_MOODS,
  SHOP_MASCOT_THANKS_IMAGE,
  SHOP_MASCOT_THANKS_LINE,
  SHOP_MOBILE_BACKGROUND_IMAGE,
  SHOP_WALLET_IMAGE
} from "../shared/shopMascotAssets.js";

export function pickShopMascotLine(random = Math.random, lines = SHOP_MASCOT_LINES) {
  const pool = Array.isArray(lines) && lines.length ? lines : SHOP_MASCOT_LINES;
  const value = Number(random());
  const index = Math.min(
    pool.length - 1,
    Math.max(0, Math.floor(value * pool.length))
  );
  return pool[index];
}

export function eligibleShopItems(items = [], user = {}) {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => (
    item
    && item.purchasable !== false
    && !isShopItemOwned(item, user)
    && !isShopItemSoldOut(item)
  ));
}

export function selectShopBatch(items = [], user = {}, previousIds = [], random = Math.random, size = SHOP_BATCH_SIZE) {
  const previous = new Set(previousIds);
  const candidates = eligibleShopItems(items, user);
  const fresh = shuffleShopItems(candidates.filter((item) => !previous.has(item.id)), random);
  const repeated = shuffleShopItems(candidates.filter((item) => previous.has(item.id)), random);
  return [...fresh, ...repeated].slice(0, Math.max(0, Number(size) || 0));
}

export function shuffleShopItems(items = [], random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const value = Math.min(0.999999, Math.max(0, Number(random()) || 0));
    const target = Math.floor(value * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function buildShopCardPresentation(items = [], random = Math.random) {
  return items.map((item, index) => ({
    item,
    rotation: roundShopMotion(-2 + ((Number(random()) || 0) * 4)),
    floatDistance: roundShopMotion(6 + ((Number(random()) || 0) * 3)),
    floatDuration: roundShopMotion(4.2 + ((Number(random()) || 0) * 1.8)),
    floatDelay: roundShopMotion(-((Number(random()) || 0) * 8)),
    stableIndex: index
  }));
}

function roundShopMotion(value) {
  return Math.round(value * 100) / 100;
}

export function isShopItemOwned(item = {}, user = {}) {
  if (item.category === "character") return Boolean(user?.ownedCharacters?.includes(item.targetId));
  if (item.category === "decoration") return Boolean(user?.ownedDecorations?.includes(item.targetId));
  if (item.category === "music") return Boolean(user?.ownedMusicIds?.includes(item.targetId));
  return false;
}

export function isShopItemSoldOut(item = {}) {
  return item.category === "item" && item.stockQuantity >= 0 && (item.remainingStock ?? item.stockQuantity) <= 0;
}

export function getShopItemDescription(item = {}) {
  return String(item.description ?? "").trim() || "暂无介绍";
}

export function getShopItemQuantityLabel(item = {}) {
  if (item.category !== "item") return "";
  if (item.stockQuantity >= 0) return `剩余 ${item.remainingStock ?? item.stockQuantity}`;
  return "不限量";
}

export function getShopItemCategoryLabel(item = {}) {
  return SHOP_ITEM_CATEGORY_LABELS[item.category] ?? "商品";
}

export function getShopItemQuantityBadge(item = {}) {
  if (item.category !== "item") return null;
  const stockQuantity = Number(item.stockQuantity);
  if (stockQuantity === 1) return null;
  if (stockQuantity < 0) return { text: "∞", ariaLabel: "不限量" };
  const remaining = Math.max(0, Number(item.remainingStock ?? stockQuantity) || 0);
  return { text: String(remaining), ariaLabel: `剩余 ${remaining}` };
}
