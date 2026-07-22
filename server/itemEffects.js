import { canonicalCharacterId } from "../src/shared/characterAliases.js";

export const RAINBOW_BEAN_CANDY_ID = "rainbow-bean-candy";
export const SIGRIKA_CANDY_EFFECT_TEXT = "西格莉卡吃下糖果后一直打嗝，急匆匆跑去找陆医生了。看来暂时不能找她下棋了。";
export const DENIA_CANDY_EFFECT_TEXT = "达妮娅吃下糖果后，双眼和嘴巴同时喷出了三道彩虹射线。达妮娅惊呼：“{username}！你到底给我吃了什么！”";

export function parseItemEffects(value) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) {
    return normalizeItemEffects(value);
  }
  try {
    return normalizeItemEffects(JSON.parse(String(value)));
  } catch {
    return {};
  }
}

export function serializeItemEffects(value) {
  return JSON.stringify(normalizeItemEffects(value));
}

export function normalizeItemEffects(value) {
  return {
    ...(value?.sigrikaCandyDisabled ? { sigrikaCandyDisabled: true } : {}),
    ...(value?.deniaRainbowGlow ? { deniaRainbowGlow: true } : {})
  };
}

export function blockedCharactersForItemEffects(value) {
  const effects = parseItemEffects(value);
  return effects.sigrikaCandyDisabled ? new Set(["sigrika"]) : new Set();
}

export function characterHasRainbowCandyGlow(characterId, itemEffects) {
  return canonicalCharacterId(characterId) === "denia" && parseItemEffects(itemEffects).deniaRainbowGlow;
}

export function clearCandyEffectsForValidGame(user, characterId) {
  const effects = parseItemEffects(user?.itemEffects);
  const next = { ...effects };
  if (next.sigrikaCandyDisabled) delete next.sigrikaCandyDisabled;
  if (canonicalCharacterId(characterId) === "denia" && next.deniaRainbowGlow) delete next.deniaRainbowGlow;
  return {
    changed: JSON.stringify(next) !== JSON.stringify(effects),
    itemEffects: serializeItemEffects(next)
  };
}
