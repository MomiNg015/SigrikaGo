import { canonicalCharacterId } from './characterAliases.js';
import { CHARACTER_PORTRAIT_ASSETS } from './characterPortraitAssetCatalog.js';
import { characterPortraitImageProps } from './characterPortraits.js';

const STANDARD_HANDBOOK_PORTRAITS = {
  // Visually measured pupils and main head volume; long hair, ribbons and
  // halos are excluded from headWidth so neighboring faces share a scale.
  sigrika: { focal: [405, 181], headWidth: 270, cropWidth: 430 },
  denia: { focal: [422, 202], headWidth: 266, cropWidth: 450 },
  aemeath: { focal: [391, 182], headWidth: 228, cropWidth: 440 },
  lynae: { focal: [377, 163], headWidth: 234, cropWidth: 440 },
  mornye: { focal: [422, 219], headWidth: 260, cropWidth: 470 },
  chisa: { focal: [433, 153], headWidth: 234, cropWidth: 440 },
  changli: { focal: [417, 146], headWidth: 242, cropWidth: 450 },
  qiuyuan: { focal: [389, 160], headWidth: 232, desktopScale: 1.1, cropWidth: 450 },
  nabomo: { focal: [402, 216], headWidth: 282, desktopScale: .91, cropWidth: 460 },
};

// A handbook-specific default view. Costume, candy, corruption and custom URLs
// continue to resolve through the shared runtime portrait owner.
export function resolveHandbookPortrait(character = {}, { itemEffects = {}, user = null } = {}) {
  const id = canonicalCharacterId(character.id ?? character.slug);
  const resolved = characterPortraitImageProps(character, { itemEffects, user });
  const builtin = CHARACTER_PORTRAIT_ASSETS[id];
  const standard = STANDARD_HANDBOOK_PORTRAITS[id];
  const costume = user?.equippedCostumes?.[id];
  const isBuiltin = builtin && (!resolved.src || resolved.src === builtin.url || resolved.src === builtin.legacyUrl);
  if (standard && isBuiltin && !costume?.portraitUrl && !costume?.candyEffectPortraitUrl) {
    return { src: `/assets/characters/handbook-sprites/${id}.webp`,
      isStandard: true, width: 832, height: 1216, visibleTop: 0, ...standard };
  }
  return { ...resolved, isStandard: false, width: 900, height: 900,
    focal: id === 'baconbits' ? [450, 389] : [450, 450],
    cropWidth: id === 'baconbits' ? 700 : 900, visibleTop: id === 'baconbits' ? 175 : 0 };
}
