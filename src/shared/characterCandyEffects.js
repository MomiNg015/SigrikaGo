import { canonicalCharacterId } from "./characterAliases.js";

export const RAINBOW_BEAN_CANDY_ICON = "/assets/items/rainbow-bean-candy.webp";

const CHARACTER_ITEM_EFFECT_BADGES = [
  {
    characterId: "aemeath",
    effectKey: "aemeathRainbowMove",
    itemId: "rainbow-bean-candy",
    label: "彩虹落子模式",
    icon: RAINBOW_BEAN_CANDY_ICON
  },
  {
    characterId: "sigrika",
    effectKey: "sigrikaCandyDisabled",
    itemId: "rainbow-bean-candy",
    label: "彩虹豆豆跳跳糖效果中",
    icon: RAINBOW_BEAN_CANDY_ICON
  },
  {
    characterId: "denia",
    effectKey: "deniaRainbowGlow",
    itemId: "rainbow-bean-candy",
    label: "彩虹豆豆跳跳糖效果中",
    icon: RAINBOW_BEAN_CANDY_ICON
  },
  {
    characterId: "lynae",
    effectKey: "lynaeContraryVoice",
    itemId: "rainbow-bean-candy",
    label: "反话语音模式",
    icon: RAINBOW_BEAN_CANDY_ICON
  }
];

export function activeCharacterItemEffects(characterId, itemEffects = {}) {
  const canonicalId = canonicalCharacterId(characterId);
  return CHARACTER_ITEM_EFFECT_BADGES.filter((effect) => (
    effect.characterId === canonicalId && itemEffects?.[effect.effectKey]
  ));
}
