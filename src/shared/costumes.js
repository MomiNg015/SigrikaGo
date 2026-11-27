export const FRACTSIDUS_COSTUME_IDS = Object.freeze(["denia-costume-01", "sigrika-costume-01", "nabomo-costume-01"]);
export const RETIRED_COSTUME_IDS = Object.freeze(["denia-costume-02", "nabomo-costume-02"]);
export const FRACTSIDUS_INVITATION = "想不到你竟然...咳咳，也许我们的理念十分契合呢。怎么样，要不加入我们残星会吧？";

import { canonicalCharacterId } from "./characterAliases.js";

export const DEFAULT_COSTUME_ID = "default";
export const DEFAULT_COSTUME_PORTRAIT_FRAMING = Object.freeze({
  scalePercent: 100,
  offsetXPercent: 0,
  offsetYPercent: 0
});
export const COSTUME_PORTRAIT_SCALE_RANGE = Object.freeze({ min: 50, max: 150 });
export const COSTUME_PORTRAIT_OFFSET_RANGE = Object.freeze({ min: -50, max: 50 });

export function finalCostumePrice(costume) {
  const discount = clampInteger(costume?.discountPercent, 0, 100, 0);
  return Math.max(0, Math.ceil(clampInteger(costume?.priceCoins, 0, Number.MAX_SAFE_INTEGER, 0) * (100 - discount) / 100));
}

export function normalizeCostumeId(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function toCostumePayload(costume) {
  if (!costume) return null;
  const framing = normalizeCostumePortraitFraming(costume);
  return {
    id: String(costume.id ?? ""),
    name: String(costume.name ?? ""),
    characterSlug: canonicalCharacterId(costume.characterSlug),
    portraitUrl: String(costume.portraitUrl ?? ""),
    candyEffectPortraitUrl: String(costume.candyEffectPortraitUrl ?? ""),
    portraitScalePercent: framing.scalePercent,
    portraitOffsetXPercent: framing.offsetXPercent,
    portraitOffsetYPercent: framing.offsetYPercent,
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
    portraitScalePercent: DEFAULT_COSTUME_PORTRAIT_FRAMING.scalePercent,
    portraitOffsetXPercent: DEFAULT_COSTUME_PORTRAIT_FRAMING.offsetXPercent,
    portraitOffsetYPercent: DEFAULT_COSTUME_PORTRAIT_FRAMING.offsetYPercent,
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

export function normalizeCostumePortraitFraming(costume = {}) {
  return {
    scalePercent: clampInteger(
      costume.portraitScalePercent,
      COSTUME_PORTRAIT_SCALE_RANGE.min,
      COSTUME_PORTRAIT_SCALE_RANGE.max,
      DEFAULT_COSTUME_PORTRAIT_FRAMING.scalePercent
    ),
    offsetXPercent: clampInteger(
      costume.portraitOffsetXPercent,
      COSTUME_PORTRAIT_OFFSET_RANGE.min,
      COSTUME_PORTRAIT_OFFSET_RANGE.max,
      DEFAULT_COSTUME_PORTRAIT_FRAMING.offsetXPercent
    ),
    offsetYPercent: clampInteger(
      costume.portraitOffsetYPercent,
      COSTUME_PORTRAIT_OFFSET_RANGE.min,
      COSTUME_PORTRAIT_OFFSET_RANGE.max,
      DEFAULT_COSTUME_PORTRAIT_FRAMING.offsetYPercent
    )
  };
}

export function costumePortraitFrameStyle(costume = null) {
  const framing = normalizeCostumePortraitFraming(costume ?? {});
  if (
    framing.scalePercent === DEFAULT_COSTUME_PORTRAIT_FRAMING.scalePercent
    && framing.offsetXPercent === DEFAULT_COSTUME_PORTRAIT_FRAMING.offsetXPercent
    && framing.offsetYPercent === DEFAULT_COSTUME_PORTRAIT_FRAMING.offsetYPercent
  ) return undefined;
  return {
    scale: String(framing.scalePercent / 100),
    translate: `${framing.offsetXPercent}% ${framing.offsetYPercent}%`
  };
}

function clampInteger(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}
