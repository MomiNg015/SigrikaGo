import { canonicalCharacterId } from "../src/shared/characterAliases.js";
import {
  RAINBOW_BEAN_CANDY_ID,
  RAINBOW_BEAN_CANDY_TARGET_RULES
} from "../src/shared/rainbowBeanCandy.js";

export { RAINBOW_BEAN_CANDY_ID };
export const SIGRIKA_CANDY_EFFECT_TEXT = "西格莉卡吃下糖果后一直打嗝，急匆匆跑去找陆医生了。看来暂时不能找她下棋了。";
export const DENIA_CANDY_EFFECT_TEXT = "达妮娅吃下糖果后，双眼和嘴巴同时喷出了三道彩虹射线。达妮娅惊呼：“{username}！你到底给我吃了什么！”";
export const AEMEATH_CANDY_EFFECT_TEXT = "爱弥斯吃下糖果后进入了“彩虹落子模式”，每次落子都会绽开七彩像素光纹。";
export const LYNAE_CANDY_EFFECT_TEXT = "琳奈吃下糖果后，说出口的关键词全都变成了反话，连对局语音也开始混乱。";

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
  const normalized = {};
  for (const { effectKey } of Object.values(RAINBOW_BEAN_CANDY_TARGET_RULES)) {
    if (value?.[effectKey]) normalized[effectKey] = true;
  }
  return normalized;
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
  if (canonicalCharacterId(characterId) === "aemeath" && next.aemeathRainbowMove) delete next.aemeathRainbowMove;
  if (canonicalCharacterId(characterId) === "lynae" && next.lynaeContraryVoice) delete next.lynaeContraryVoice;
  return {
    changed: JSON.stringify(next) !== JSON.stringify(effects),
    itemEffects: serializeItemEffects(next)
  };
}
