import { canonicalCharacterId } from "../src/shared/characterAliases.js";

export const RAINBOW_BEAN_CANDY_ID = "rainbow-bean-candy";
export const SIGRIKA_CANDY_EFFECT_TEXT = "西格莉卡吃下了糖果，一直在打嗝。西格莉卡很不好意思，急匆匆跑去找陆医生，但一不小心从口袋里掉出了30金币，你将其捡了起来，刚想叫住西格莉卡，却发现人早已跑得无影无踪。没办法，这30金币先由你来保管吧。";
export const DENIA_CANDY_EFFECT_TEXT = "达妮娅吃下了糖果，突然全身发出了彩虹光。达妮娅惊呼：“{username}！你到底给我吃了什么！”";

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
