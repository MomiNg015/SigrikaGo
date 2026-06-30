import { ADMIN_DEFAULT_CONFIG } from "./adminDefaultSnapshot.js";

export async function seedAdminDefaultConfig(prisma, snapshot = ADMIN_DEFAULT_CONFIG) {
  await seedSiteSettings(prisma, snapshot.siteSettings);
  await seedCharacters(prisma, snapshot.characters);
  await seedDecorations(prisma, snapshot.decorations);
  await seedShopItems(prisma, snapshot.shopItems);
  await seedGachaPools(prisma, snapshot.gachaPools);
  await seedAchievementRewardAssets(prisma, snapshot.achievementRewardAssets);
  await seedAchievements(prisma, snapshot.achievements);
  await seedMusicTrackSettings(prisma, snapshot.musicTrackSettings);
}

async function seedSiteSettings(prisma, rows = []) {
  if (!prisma?.siteSetting?.upsert) return;
  for (const row of rows) {
    await prisma.siteSetting.upsert({
      where: { key: row.key },
      create: { key: row.key, value: row.value },
      update: { value: row.value }
    });
  }
}

async function seedCharacters(prisma, rows = []) {
  if (!prisma?.character?.findUnique || !prisma?.character?.create) return;
  for (const row of rows) {
    const existing = await prisma.character.findUnique({ where: { slug: row.slug } });
    const data = characterData(row, { existing: Boolean(existing) });
    if (existing) {
      if (!prisma.character.update) continue;
      await prisma.character.update({
        where: { slug: row.slug },
        data: {
          ...data,
          ...(row.skill ? {
            skill: {
              upsert: {
                create: skillCreateData(row.skill),
                update: skillCreateData(row.skill)
              }
            }
          } : {})
        }
      });
      continue;
    }
    await prisma.character.create({
      data: {
        slug: row.slug,
        ...data,
        ...(row.skill ? { skill: { create: skillCreateData(row.skill) } } : {})
      }
    });
  }
}

async function seedDecorations(prisma, rows = []) {
  if (!prisma?.decoration?.findUnique || !prisma?.decoration?.create) return;
  for (const row of rows) {
    const existing = await prisma.decoration.findUnique({ where: { slug: row.slug } });
    const data = decorationData(row);
    if (existing) {
      if (!prisma.decoration.update) continue;
      await prisma.decoration.update({
        where: { slug: row.slug },
        data
      });
      continue;
    }
    await prisma.decoration.create({
      data: {
        slug: row.slug,
        ...data
      }
    });
  }
}

async function seedShopItems(prisma, rows = []) {
  if (!prisma?.shopItem?.findFirst || !prisma?.shopItem?.create) return;
  for (const row of rows) {
    const existing = await prisma.shopItem.findFirst({
      where: {
        category: row.category,
        targetId: row.targetId
      }
    });
    const data = shopItemData(row, { existing: Boolean(existing) });
    if (existing) {
      if (!prisma.shopItem.update) continue;
      await prisma.shopItem.update({
        where: { id: existing.id },
        data
      });
      continue;
    }
    await prisma.shopItem.create({
      data
    });
  }
}

async function seedGachaPools(prisma, rows = []) {
  if (!prisma?.gachaPool?.findUnique || !prisma?.gachaPool?.create) return;
  for (const row of rows) {
    const existing = await prisma.gachaPool.findUnique({ where: { id: row.id } });
    const data = gachaPoolData(row);
    if (existing) {
      if (!prisma.gachaPool.update) continue;
      await prisma.gachaPool.update({
        where: { id: row.id },
        data: {
          ...data,
          prizes: {
            deleteMany: {},
            create: gachaPrizeCreateData(row.prizes)
          }
        }
      });
      continue;
    }
    await prisma.gachaPool.create({
      data: {
        id: row.id,
        ...data,
        prizes: { create: gachaPrizeCreateData(row.prizes) }
      }
    });
  }
}

async function seedAchievementRewardAssets(prisma, rows = []) {
  if (!prisma?.achievementRewardAsset?.findUnique || !prisma?.achievementRewardAsset?.create) return;
  for (const row of rows) {
    const existing = await prisma.achievementRewardAsset.findUnique({ where: { id: row.id } });
    const data = achievementRewardAssetData(row);
    if (existing) {
      if (!prisma.achievementRewardAsset.update) continue;
      await prisma.achievementRewardAsset.update({
        where: { id: row.id },
        data
      });
      continue;
    }
    await prisma.achievementRewardAsset.create({
      data: {
        id: row.id,
        ...data
      }
    });
  }
}

async function seedAchievements(prisma, rows = []) {
  if (!prisma?.achievement?.findUnique || !prisma?.achievement?.create) return;
  for (const row of rows) {
    const existing = await prisma.achievement.findUnique({ where: { key: row.key } });
    const data = achievementData(row);
    if (existing) {
      if (!prisma.achievement.update) continue;
      await prisma.achievement.update({
        where: { key: row.key },
        data
      });
      continue;
    }
    await prisma.achievement.create({
      data: {
        id: row.id,
        key: row.key,
        ...data
      }
    });
  }
}

async function seedMusicTrackSettings(prisma, rows = []) {
  if (!prisma?.musicTrackSetting?.upsert) return;
  for (const row of rows) {
    await prisma.musicTrackSetting.upsert({
      where: { id: row.id },
      create: { id: row.id, displayName: row.displayName ?? "" },
      update: { displayName: row.displayName ?? "" }
    });
  }
}

function characterData(row, { existing = false } = {}) {
  const data = {
    name: row.name,
    description: row.description ?? "",
    portraitUrl: row.portraitUrl,
    portraitSource: row.portraitSource ?? "url",
    acquisitionMethod: row.acquisitionMethod ?? "",
    source: row.source ?? "default",
    palette: row.palette ?? "#5d7fe8",
    enabled: row.enabled !== false,
    sortOrder: row.sortOrder ?? 0
  };
  const hasCvFields = Object.hasOwn(row, "cvName") || Object.hasOwn(row, "cvUrl");
  if (!existing || hasCvFields) {
    data.cvName = row.cvName ?? "";
    data.cvUrl = row.cvUrl ?? "";
  }
  return data;
}

function decorationData(row) {
  return {
    name: row.name,
    description: row.description ?? "",
    imageUrl: row.imageUrl ?? "",
    source: row.source ?? "default",
    enabled: row.enabled !== false,
    sortOrder: row.sortOrder ?? 0
  };
}

function shopItemData(row, { existing = false } = {}) {
  const data = {
    name: row.name,
    category: row.category,
    targetId: row.targetId,
    itemTargetType: row.itemTargetType ?? "self",
    stockQuantity: row.stockQuantity ?? -1,
    priceCoins: row.priceCoins,
    discountPercent: row.discountPercent ?? 0,
    purchasable: row.purchasable !== false,
    enabled: row.enabled !== false,
    sortOrder: row.sortOrder ?? 0,
    description: row.description ?? "",
    imageUrl: row.imageUrl ?? "",
    source: row.source ?? "default"
  };
  const hasIllustFields = Object.hasOwn(row, "illustName") || Object.hasOwn(row, "illustUrl");
  if (!existing || hasIllustFields) {
    data.illustName = row.illustName ?? "";
    data.illustUrl = row.illustUrl ?? "";
  }
  return data;
}

function gachaPoolData(row) {
  return {
    name: row.name,
    description: row.description ?? "",
    enabled: row.enabled !== false,
    permanent: Boolean(row.permanent),
    startsAt: row.startsAt ?? null,
    endsAt: row.endsAt ?? null,
    singleDrawPrice: row.singleDrawPrice,
    tenDrawPrice: row.tenDrawPrice,
    featuredPrizeId: row.featuredPrizeId ?? null,
    featuredPrizeIds: row.featuredPrizeIds ?? null,
    sortOrder: row.sortOrder ?? 0
  };
}

function gachaPrizeCreateData(prizes = []) {
  return prizes.map((prize) => ({
    id: prize.id,
    type: prize.type,
    targetId: prize.targetId ?? "",
    quantity: prize.quantity,
    probabilityBasisPoints: prize.probabilityBasisPoints,
    enabled: prize.enabled !== false,
    name: prize.name ?? "",
    imageUrl: prize.imageUrl ?? "",
    sortOrder: prize.sortOrder ?? 0
  }));
}

function achievementRewardAssetData(row) {
  return {
    type: row.type,
    name: row.name,
    description: row.description ?? "",
    imageUrl: row.imageUrl ?? "",
    text: row.text ?? "",
    targetType: row.targetType ?? "",
    targetId: row.targetId ?? "",
    amount: row.amount ?? 0,
    enabled: row.enabled !== false,
    deletedAt: row.deletedAt ?? null,
    sortOrder: row.sortOrder ?? 0
  };
}

function achievementData(row) {
  return {
    name: row.name,
    content: row.content,
    conditionType: row.conditionType,
    conditionParams: row.conditionParams ?? "{}",
    rewardAssetId: row.rewardAssetId ?? null,
    enabled: row.enabled !== false,
    deletedAt: row.deletedAt ?? null,
    sortOrder: row.sortOrder ?? 0
  };
}

function skillCreateData(skill) {
  return {
    effectType: skill.effectType,
    name: skill.name,
    description: skill.description,
    uses: skill.uses,
    freeTurn: skill.freeTurn,
    targetRule: skill.targetRule,
    paramsJson: skill.paramsJson ?? "{}",
    costType: skill.costType ?? "numeric",
    costValue: skill.costValue ?? "0",
    systemMessage: skill.systemMessage,
    enabled: skill.enabled !== false
  };
}
