import { isShopItemOwned } from "../shopModalHelpers.js";

export function getShopOwnedItemQuantity(item = {}, user = {}) {
  if (item.category !== "item") return 0;
  const ownedItems = Array.isArray(user?.ownedItems) ? user.ownedItems : [];
  const owned = ownedItems.find((entry) => entry?.itemId === item.targetId);
  return Number(owned?.quantity ?? 0) || 0;
}

export function getShopItemDetailOwned(item = {}, user = {}) {
  if (item.category === "item") return getShopOwnedItemQuantity(item, user) > 0;
  if (item.category === "character" || item.category === "decoration") return isShopItemOwned(item, user);
  return false;
}

export function getShopItemDetailStatus(item = {}, user = {}) {
  if (item.category === "item") {
    const quantity = getShopOwnedItemQuantity(item, user);
    return quantity > 0 ? `拥有 ${quantity}` : "未持有";
  }
  if (item.category === "character") return isShopItemOwned(item, user) ? "已持有" : "尚未拥有该角色";
  if (item.category === "decoration") return isShopItemOwned(item, user) ? "已持有" : "尚未拥有该装饰";
  return "状态未知";
}

export function getShopCategoryLabel(category = "") {
  if (category === "character") return "角色";
  if (category === "item") return "道具";
  if (category === "decoration") return "装饰";
  return "商品";
}
