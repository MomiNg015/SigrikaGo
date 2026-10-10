import { characterChibiSource, isBuiltinCharacterPortrait } from "./characterChibiPortraits.js";
import { DENIA_SKILL_FORM, DENIA_SKILL_FORM_ASSET } from "./deniaSkillForm.js";
import { AEMEATH_SKILL_FORM, AEMEATH_SKILL_FORM_ASSET } from "./aemeathSkillForm.js";
import { canonicalCharacterId } from "./characterAliases.js";
import { DENIA_CANDY_PORTRAIT } from "./candyPortraits.js";
import { DENIA_CANDY_PORTRAIT_ASSET, SIGRIKA_CORRUPTED_PORTRAIT_ASSET } from "./characterPortraitAssetCatalog.js";
import {
  costumePortraitFrameStyle,
  normalizeCostumePortraitFraming
} from "./costumes.js";

export function resolveCharacterPortraitPresentation(character = {}, {
  itemEffects = {},
  user = null,
  equippedCostumes = null,
  costumeSnapshot = null,
  variant = "full",
  battleForm = null
} = {}) {
  const characterId = canonicalCharacterId(character.id ?? character.slug);
  if (characterId === "aemeath" && battleForm === AEMEATH_SKILL_FORM) {
    return portraitPresentation(AEMEATH_SKILL_FORM_ASSET);
  }
  if (characterId === "denia" && battleForm === DENIA_SKILL_FORM) {
    return portraitPresentation(DENIA_SKILL_FORM_ASSET);
  }
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
    return portraitPresentation(variant === "avatar" ? DENIA_CANDY_PORTRAIT_ASSET.avatarUrl : DENIA_CANDY_PORTRAIT);
  }
  const portraitUrl = costume?.portraitUrl
    || character.portraitUrl
    || character.portrait
    || "";
  if (!costume?.portraitUrl && isBuiltinCharacterPortrait(characterId, portraitUrl)) {
    return { ...portraitPresentation(characterChibiSource(characterId, variant)), presentation: "chibi" };
  }
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
