import { canonicalCharacterId } from "./characterAliases.js";
import { DENIA_CANDY_PORTRAIT } from "./candyPortraits.js";
import { SIGRIKA_CORRUPTED_PORTRAIT_ASSET } from "./characterPortraitAssetCatalog.js";
import {
  costumePortraitFrameStyle,
  normalizeCostumePortraitFraming
} from "./costumes.js";

export function resolveCharacterPortraitPresentation(character = {}, {
  itemEffects = {},
  user = null,
  equippedCostumes = null,
  costumeSnapshot = null
} = {}) {
  const characterId = canonicalCharacterId(character.id ?? character.slug);
  const costume = costumeSnapshot
    ?? equippedCostumes?.[characterId]
    ?? user?.equippedCostumes?.[characterId]
    ?? null;

  if (characterId === "sigrika" && user?.sigrikaCandyArc?.corrupted === true) {
    return portraitPresentation(SIGRIKA_CORRUPTED_PORTRAIT_ASSET.url);
  }

  if (characterId === "denia" && itemEffects?.deniaRainbowGlow) {
    if (costume?.candyEffectPortraitUrl) {
      return portraitPresentation(costume.candyEffectPortraitUrl, costume);
    }
    return portraitPresentation(DENIA_CANDY_PORTRAIT);
  }
  const portraitUrl = costume?.portraitUrl
    || character.portraitUrl
    || character.portrait
    || "";
  return portraitPresentation(portraitUrl, costume?.portraitUrl ? costume : null);
}

export function resolveCharacterPortrait(character = {}, options = {}) {
  return resolveCharacterPortraitPresentation(character, options).src;
}

export function characterPortraitImageProps(character = {}, options = {}) {
  const presentation = resolveCharacterPortraitPresentation(character, options);
  return {
    src: presentation.src,
    ...(presentation.style ? { style: presentation.style } : {})
  };
}

function portraitPresentation(src, costume = null) {
  return {
    src,
    ...normalizeCostumePortraitFraming(costume ?? {}),
    style: costumePortraitFrameStyle(costume)
  };
}
