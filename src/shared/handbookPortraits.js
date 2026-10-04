import { canonicalCharacterId } from './characterAliases.js';
import { CHARACTER_PORTRAIT_ASSETS } from './characterPortraitAssetCatalog.js';
import { characterPortraitImageProps } from './characterPortraits.js';

const STANDARD_HANDBOOK_PORTRAITS = {
  sigrika: { focal: [415, 192], cropWidth: 430 },
  denia: { focal: [420, 217], cropWidth: 450 },
  aemeath: { focal: [395, 181], cropWidth: 440 },
  lynae: { focal: [391, 181], cropWidth: 440 },
  mornye: { focal: [422, 230], cropWidth: 470 },
  chisa: { focal: [435, 163], cropWidth: 440 },
  changli: { focal: [426, 167], cropWidth: 450 },
  qiuyuan: { focal: [383, 163], cropWidth: 450 },
  nabomo: { focal: [404, 228], cropWidth: 460 },
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
