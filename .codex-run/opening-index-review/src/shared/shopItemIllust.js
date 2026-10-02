import { normalizeCreditName, normalizeCreditUrl } from "./creditLink.js";

export function normalizeShopItemIllustName(value) {
  return normalizeCreditName(value);
}

export function normalizeShopItemIllustUrl(value) {
  return normalizeCreditUrl(value);
}
