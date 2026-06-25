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
      update: {}
    });
  }
}

async function seedCharacters(prisma, rows = []) {
  if (!prisma?.character?.findUnique || !prisma?.character?.create) return;
  for (const row of rows) {
    const existing = await prisma.character.findUnique({ where: { slug: row.slug } });
    if (existing) continue;
    await prisma.character.create({
      data: {
        slug: row.slug,
        name: row.name,
        description: row.description ?? "",
        portraitUrl: row.portraitUrl,
        portraitSource: row.portraitSource ?? "url",
        acquisitionMethod: row.acquisitionMethod ?? "",
        source: row.source ?? "default",
        palette: row.palette ?? "#5d7fe8",
        enabled: row.enabled !== false,
        sortOrder: row.sortOrder ?? 0,
        ...(row.skill ? { skill: { create: skillCreateData(row.skill) } } : {})
      }
    });
  }
}

async function seedDecorations(prisma, rows = []) {
  if (!prisma?.decoration?.findUnique || !prisma?.decoration?.create) return;
  for (const row of rows) {
    const existing = await prisma.decoration.findUnique({ where: { slug: row.slug } });
    if (existing) continue;
    await prisma.decoration.create({
      data: {
        slug: row.slug,
        name: row.name,
        description: row.description ?? "",
        imageUrl: row.imageUrl ?? "",
        source: row.source ?? "default",
        enabled: row.enabled !== false,
        sortOrder: row.sortOrder ?? 0
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
    if (existing) continue;
    await prisma.shopItem.create({
      data: {
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
      }
    });
  }
}

async function seedGachaPools(prisma, rows = []) {
  if (!prisma?.gachaPool?.findUnique || !prisma?.gachaPool?.create) return;
  for (const row of rows) {
    const existing = await prisma.gachaPool.findUnique({ where: { id: row.id } });
    if (existing) continue;
    await prisma.gachaPool.create({
      data: {
        id: row.id,
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
        sortOrder: row.sortOrder ?? 0,
        prizes: {
          create: (row.prizes ?? []).map((prize) => ({
            id: prize.id,
            type: prize.type,
            targetId: prize.targetId ?? "",
            quantity: prize.quantity,
            probabilityBasisPoints: prize.probabilityBasisPoints,
            enabled: prize.enabled !== false,
            name: prize.name ?? "",
            imageUrl: prize.imageUrl ?? "",
            sortOrder: prize.sortOrder ?? 0
          }))
        }
      }
    });
  }
}

async function seedAchievementRewardAssets(prisma, rows = []) {
  if (!prisma?.achievementRewardAsset?.findUnique || !prisma?.achievementRewardAsset?.create) return;
  for (const row of rows) {
    const existing = await prisma.achievementRewardAsset.findUnique({ where: { id: row.id } });
    if (existing) continue;
    await prisma.achievementRewardAsset.create({
      data: {
        id: row.id,
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
      }
    });
  }
}

async function seedAchievements(prisma, rows = []) {
  if (!prisma?.achievement?.findUnique || !prisma?.achievement?.create) return;
  for (const row of rows) {
    const existing = await prisma.achievement.findUnique({ where: { key: row.key } });
    if (existing) continue;
    await prisma.achievement.create({
      data: {
        id: row.id,
        key: row.key,
        name: row.name,
        content: row.content,
        conditionType: row.conditionType,
        conditionParams: row.conditionParams ?? "{}",
        rewardAssetId: row.rewardAssetId ?? null,
        enabled: row.enabled !== false,
        deletedAt: row.deletedAt ?? null,
        sortOrder: row.sortOrder ?? 0
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
      update: {}
    });
  }
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
