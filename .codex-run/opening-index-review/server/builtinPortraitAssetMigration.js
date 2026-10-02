import {
  CHARACTER_PORTRAIT_ASSETS,
  COSTUME_PORTRAIT_ASSETS
} from "../src/shared/characterPortraitAssetCatalog.js";
import { DEFAULT_COSTUME_PORTRAIT_FRAMING } from "../src/shared/costumes.js";

export async function migrateBuiltinPortraitAssets(prisma) {
  const result = { characters: 0, costumes: 0 };

  if (prisma?.character?.updateMany) {
    for (const [slug, asset] of Object.entries(CHARACTER_PORTRAIT_ASSETS)) {
      const changed = await prisma.character.updateMany({
        where: {
          slug,
          portraitUrl: asset.legacyUrl,
          portraitSource: "url",
          source: "default"
        },
        data: {
          portraitUrl: asset.url,
          portraitSource: "url"
        }
      });
      result.characters += changed?.count ?? 0;
    }
  }

  if (prisma?.costume?.updateMany) {
    for (const [id, asset] of Object.entries(COSTUME_PORTRAIT_ASSETS)) {
      const changed = await prisma.costume.updateMany({
        where: {
          id,
          portraitUrl: asset.legacyUrl,
          portraitScalePercent: asset.legacyScalePercent,
          portraitOffsetXPercent: DEFAULT_COSTUME_PORTRAIT_FRAMING.offsetXPercent,
          portraitOffsetYPercent: DEFAULT_COSTUME_PORTRAIT_FRAMING.offsetYPercent,
          source: "default"
        },
        data: {
          portraitUrl: asset.url,
          portraitScalePercent: DEFAULT_COSTUME_PORTRAIT_FRAMING.scalePercent,
          portraitOffsetXPercent: DEFAULT_COSTUME_PORTRAIT_FRAMING.offsetXPercent,
          portraitOffsetYPercent: DEFAULT_COSTUME_PORTRAIT_FRAMING.offsetYPercent
        }
      });
      result.costumes += changed?.count ?? 0;
    }
  }

  return result;
}
