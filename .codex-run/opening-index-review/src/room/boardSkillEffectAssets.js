import { CHARACTER_PORTRAIT_ASSETS } from "../shared/characterPortraitAssetCatalog.js";

export const BACONBITS_IMAGE = CHARACTER_PORTRAIT_ASSETS.baconbits.url;
export const CHANGLI_FIRE_PHOENIX_IMAGE = "/assets/effects/changli-fire-phoenix.svg";
export const CHANGLI_FLAME_SPRITE_IMAGE = "/assets/effects/changli-flame-sprite.svg";
export const DANEA_BUBBLE_IMAGE = "/assets/effects/denia-bubble-pop.webp";
export const VOYAGE_STAR_CRATER_IMAGE = "/assets/effects/voyage-star-crater.webp";

const BOARD_SKILL_EFFECT_ASSET_URLS = Object.freeze({
  "double-move": Object.freeze([CHANGLI_FIRE_PHOENIX_IMAGE, CHANGLI_FLAME_SPRITE_IMAGE]),
  "flip-stone": Object.freeze([DANEA_BUBBLE_IMAGE]),
  "random-blast": Object.freeze([BACONBITS_IMAGE]),
  "voyage-star": Object.freeze([VOYAGE_STAR_CRATER_IMAGE])
});

const BOARD_SKILL_EFFECT_BLOCKING_ASSET_URLS = Object.freeze({
  "double-move": BOARD_SKILL_EFFECT_ASSET_URLS["double-move"],
  "flip-stone": BOARD_SKILL_EFFECT_ASSET_URLS["flip-stone"],
  "random-blast": BOARD_SKILL_EFFECT_ASSET_URLS["random-blast"]
});

export function boardSkillEffectAssetUrls(effectType) {
  return BOARD_SKILL_EFFECT_ASSET_URLS[effectType] ?? [];
}

export function boardSkillEffectBlockingAssetUrls(effectType) {
  return BOARD_SKILL_EFFECT_BLOCKING_ASSET_URLS[effectType] ?? [];
}
