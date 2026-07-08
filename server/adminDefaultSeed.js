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
  await seedStoryScripts(prisma, snapshot.storyScripts);
  await seedAnnouncementEntries(prisma, snapshot.announcementEntries);
  await seedOnboardingStoryScripts(prisma, snapshot.onboardingStoryScripts);
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
    const data = characterData(row, { existing: Boolean(existing) });
    if (existing) {
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
      update: {}
    });
  }
}

async function seedStoryScripts(prisma, rows = []) {
  if (!prisma?.storyScript?.findUnique || !prisma?.storyScript?.create) return;
  for (const row of rows) {
    const existing = await prisma.storyScript.findUnique({ where: { key: row.key } });
    if (existing) continue;
    await prisma.storyScript.create({
      data: {
        id: row.id,
        key: row.key,
        ...storyScriptData(row)
      }
    });
  }
}

async function seedAnnouncementEntries(prisma, rows = []) {
  if (!prisma?.announcementEntry?.findUnique || !prisma?.announcementEntry?.create) return;
  for (const row of rows) {
    const existing = await prisma.announcementEntry.findUnique({ where: { id: row.id } });
    if (existing) continue;
    await prisma.announcementEntry.create({
      data: {
        id: row.id,
        ...announcementEntryData(row)
      }
    });
  }
}

async function seedOnboardingStoryScripts(prisma, rows = []) {
  if (!prisma?.onboardingStoryScript?.findUnique || !prisma?.onboardingStoryScript?.create) return;
  for (const row of rows) {
    const existing = await prisma.onboardingStoryScript.findUnique({ where: { id: row.id } });
    if (existing) continue;
    await prisma.onboardingStoryScript.create({
      data: {
        id: row.id,
        ...onboardingStoryScriptData(row)
      }
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

function storyScriptData(row) {
  return {
    title: row.title ?? "",
    triggerType: row.triggerType,
    triggerParamsJson: row.triggerParamsJson ?? "{}",
    draftStartNodeId: row.draftStartNodeId ?? "",
    draftInitialBoardJson: row.draftInitialBoardJson ?? "",
    draftNodesJson: row.draftNodesJson ?? "[]",
    isPublished: Boolean(row.isPublished),
    publishedStartNodeId: row.publishedStartNodeId ?? "",
    publishedInitialBoardJson: row.publishedInitialBoardJson ?? "",
    publishedNodesJson: row.publishedNodesJson ?? "[]",
    firstPublishedAt: row.firstPublishedAt ?? null,
    publishedAt: row.publishedAt ?? null
  };
}

function announcementEntryData(row) {
  return {
    kind: row.kind,
    title: row.title,
    body: row.body ?? "",
    isPublished: Boolean(row.isPublished),
    pinned: Boolean(row.pinned),
    firstPublishedAt: row.firstPublishedAt ?? null,
    deletedAt: row.deletedAt ?? null
  };
}

function onboardingStoryScriptData(row) {
  return {
    draftStartNodeId: row.draftStartNodeId ?? "",
    draftNodesJson: row.draftNodesJson ?? "[]",
    isPublished: Boolean(row.isPublished),
    publishedStartNodeId: row.publishedStartNodeId ?? "",
    publishedNodesJson: row.publishedNodesJson ?? "[]",
    firstPublishedAt: row.firstPublishedAt ?? null,
    publishedAt: row.publishedAt ?? null
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
