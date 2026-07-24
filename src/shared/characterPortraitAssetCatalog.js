export const CHARACTER_PORTRAIT_ASSETS = Object.freeze({
  sigrika: portraitAsset(
    "/assets/characters/portraits/sigrika.webp",
    "/assets/sigrika_centered.webp"
  ),
  denia: portraitAsset(
    "/assets/characters/portraits/denia.webp",
    "/assets/Danea_centered.webp"
  ),
  aemeath: portraitAsset(
    "/assets/characters/portraits/aemeath.webp",
    "/assets/Aemeath_centered.webp"
  ),
  lynae: portraitAsset(
    "/assets/characters/portraits/lynae.webp",
    "/assets/characters/lynae_centered.webp"
  ),
  mornye: portraitAsset(
    "/assets/characters/portraits/mornye.webp",
    "/assets/characters/mornye.png"
  ),
  chisa: portraitAsset(
    "/assets/characters/portraits/chisa.webp",
    "/assets/characters/chisa.png"
  ),
  changli: portraitAsset(
    "/assets/characters/portraits/changli.webp",
    "/assets/characters/changli.png"
  ),
  qiuyuan: portraitAsset(
    "/assets/characters/portraits/qiuyuan.webp",
    "/assets/characters/qiuyuan.png"
  ),
  nabomo: portraitAsset(
    "/assets/characters/portraits/nabomo.webp",
    "/assets/nabomo.webp"
  ),
  baconbits: portraitAsset(
    "/assets/characters/portraits/baconbits.webp",
    "/assets/baconbits.webp"
  )
});

export const COSTUME_PORTRAIT_ASSETS = Object.freeze({
  "sigrika-costume-01": costumePortraitAsset(
    "/assets/costumes/portraits/sigrika-costume-01.webp",
    "/assets/costumes/sigrika-01.webp",
    83
  ),
  "denia-costume-01": costumePortraitAsset(
    "/assets/costumes/portraits/denia-costume-01.webp",
    "/assets/costumes/denia-01.webp",
    88
  ),
  "denia-costume-02": costumePortraitAsset(
    "/assets/costumes/portraits/denia-costume-02.webp",
    "/assets/costumes/denia-02.webp",
    88
  ),
  "nabomo-costume-01": costumePortraitAsset(
    "/assets/costumes/portraits/nabomo-costume-01.webp",
    "/assets/costumes/nabomo-01.webp",
    94
  ),
  "nabomo-costume-02": costumePortraitAsset(
    "/assets/costumes/portraits/nabomo-costume-02.webp",
    "/assets/costumes/nabomo-02.webp",
    94
  )
});

export const DENIA_CANDY_PORTRAIT_ASSET = Object.freeze({
  url: "/assets/characters/portraits/denia-candy.webp",
  legacyUrl: "/assets/characters/denia_color.webp",
  requiresAnimation: true
});

export function builtinPortraitLegacySource(url) {
  for (const asset of Object.values(CHARACTER_PORTRAIT_ASSETS)) {
    if (asset.url === url) return asset.legacyUrl;
  }
  for (const asset of Object.values(COSTUME_PORTRAIT_ASSETS)) {
    if (asset.url === url) return asset.legacyUrl;
  }
  if (DENIA_CANDY_PORTRAIT_ASSET.url === url) return DENIA_CANDY_PORTRAIT_ASSET.legacyUrl;
  return "";
}

function portraitAsset(url, legacyUrl) {
  return Object.freeze({ url, legacyUrl });
}

function costumePortraitAsset(url, legacyUrl, legacyScalePercent) {
  return Object.freeze({ url, legacyUrl, legacyScalePercent });
}
