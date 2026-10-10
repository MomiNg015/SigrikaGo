import { CHARACTER_PORTRAIT_ASSETS } from "./characterPortraitAssetCatalog.js";

export const CHARACTER_CHIBI_LANDMARKS = {
  qiuyuan: { focal: [335, 525], headWidth: 540, cropWidth: 650, bodyTop: 16, bodyBottom: 1195 },
  aemeath: { focal: [401, 494], headWidth: 580, cropWidth: 680, bodyTop: 44, bodyBottom: 1196 },
  changli: { focal: [377, 488], headWidth: 600, cropWidth: 700, bodyTop: 14, bodyBottom: 1201 },
  chisa: { focal: [367, 440], headWidth: 520, cropWidth: 620, bodyTop: 49, bodyBottom: 1182 },
  lynae: { focal: [368, 465], headWidth: 570, cropWidth: 670, bodyTop: 80, bodyBottom: 1143 },
  mornye: { focal: [422, 510], headWidth: 610, cropWidth: 710, bodyTop: 21, bodyBottom: 1198 },
  denia: { focal: [458, 507], headWidth: 540, cropWidth: 650, bodyTop: 52, bodyBottom: 1169 },
  sigrika: { focal: [392, 503], headWidth: 580, cropWidth: 680, bodyTop: 70, bodyBottom: 1165 },
  nabomo: { focal: [368, 524], headWidth: 540, cropWidth: 650, bodyTop: 21, bodyBottom: 1200 },
};

export function characterChibiSource(id, variant = "full") {
  if (!CHARACTER_CHIBI_LANDMARKS[id]) return "";
  return `/assets/characters/handbook-chibi-sprites/${id}${variant === "avatar" ? "-avatar" : ""}.webp`;
}

export function isBuiltinCharacterPortrait(id, src) {
  const asset = CHARACTER_PORTRAIT_ASSETS[id];
  return Boolean(CHARACTER_CHIBI_LANDMARKS[id] && asset && (!src
    || src === asset.url || src === asset.legacyUrl
    || src === `/assets/characters/handbook-sprites/${id}.webp`
    || src === characterChibiSource(id) || src === characterChibiSource(id, "avatar")));
}
