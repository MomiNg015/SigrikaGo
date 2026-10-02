import { recruitmentItemImageUrlForType } from "../src/shared/recruitment.js";
import { RAINBOW_BEAN_CANDY_ID } from "./itemEffects.js";

export const RAINBOW_BEAN_CANDY_IMAGE_URL = "/assets/items/rainbow-bean-candy.webp";
export const RAINBOW_BEAN_CANDY_STALE_IMAGE_URLS = ["", "/assets/items/rainbow-bean-candy.png"];

export function builtinItemImageUrlForTarget(targetId, fallback = "") {
  const itemId = String(targetId ?? "").trim();
  if (itemId === RAINBOW_BEAN_CANDY_ID) return RAINBOW_BEAN_CANDY_IMAGE_URL;
  return recruitmentItemImageUrlForType(itemId, fallback);
}

export function shopCatalogImageUrl(item) {
  if (item?.category === "item") {
    return builtinItemImageUrlForTarget(item.targetId, item.imageUrl ?? "");
  }
  return item?.imageUrl ?? "";
}

export function gachaPrizeImageUrl(prize) {
  if (prize?.type === "item") {
    return builtinItemImageUrlForTarget(prize.targetId, prize.imageUrl ?? "");
  }
  return prize?.imageUrl ?? "";
}
