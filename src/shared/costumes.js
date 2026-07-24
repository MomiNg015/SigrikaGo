import { canonicalCharacterId } from "./characterAliases.js";

export const DEFAULT_COSTUME_ID = "default";

export function finalCostumePrice(costume) {
  const discount = clampInteger(costume?.discountPercent, 0, 100, 0);
  return Math.max(0, Math.ceil(clampInteger(costume?.priceCoins, 0, Number.MAX_SAFE_INTEGER, 0) * (100 - discount) / 100));
}

export function normalizeCostumeId(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function toCostumePayload(costume) {
  if (!costume) return null;
  return {
    id: String(costume.id ?? ""),
    name: String(costume.name ?? ""),
    characterSlug: canonicalCharacterId(costume.characterSlug),
    portraitUrl: String(costume.portraitUrl ?? ""),
    candyEffectPortraitUrl: String(costume.candyEffectPortraitUrl ?? ""),
    description: String(costume.description ?? ""),
    illustName: String(costume.illustName ?? ""),
    illustUrl: String(costume.illustUrl ?? ""),
    priceCoins: clampInteger(costume.priceCoins, 0, Number.MAX_SAFE_INTEGER, 0),
    discountPercent: clampInteger(costume.discountPercent, 0, 100, 0),
    finalPrice: finalCostumePrice(costume),
    shopVisible: costume.shopVisible !== false,
    purchasable: costume.purchasable !== false,
    enabled: costume.enabled !== false,
    sortOrder: clampInteger(costume.sortOrder, -1_000_000, 1_000_000, 0),
    source: String(costume.source ?? "default")
  };
}

export function defaultCostumeCard(character) {
  const characterSlug = canonicalCharacterId(character?.slug ?? character?.id);
  return {
    id: DEFAULT_COSTUME_ID,
    name: "默认服装",
    characterSlug,
    portraitUrl: String(character?.portraitUrl ?? character?.portrait ?? ""),
    candyEffectPortraitUrl: "",
    description: "角色的默认装扮。",
    illustName: String(character?.illustName ?? ""),
    illustUrl: String(character?.illustUrl ?? ""),
    priceCoins: 0,
    discountPercent: 0,
    finalPrice: 0,
    shopVisible: false,
    purchasable: false,
    enabled: true,
    sortOrder: -1,
    source: "virtual-default",
    owned: true,
    isDefault: true
  };
}

function clampInteger(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}
