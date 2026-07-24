import { ADMIN_DEFAULT_CONFIG } from "./adminDefaultSnapshot.js";
import { seedDefaultSkillTraits } from "./skillTraits.js";

export async function seedAdminDefaultConfig(prisma, snapshot = ADMIN_DEFAULT_CONFIG) {
  await seedSiteSettings(prisma, snapshot.siteSettings);
  await seedDefaultSkillTraits(prisma, snapshot.skillTraits);
  await seedCharacters(prisma, snapshot.characters);
  await seedDecorations(prisma, snapshot.decorations);
  await seedCostumes(prisma, snapshot.costumes);
  await seedShopItems(prisma, snapshot.shopItems);
  await seedGachaPools(prisma, snapshot.gachaPools);
  await seedAchievementRewardAssets(prisma, snapshot.achievementRewardAssets);
  await seedAchievements(prisma, snapshot.achievements);
  await seedMusicTrackSettings(prisma, snapshot.musicTrackSettings);
  await seedStoryScripts(prisma, snapshot.storyScripts);
  await seedAnnouncementEntries(prisma, snapshot.announcementEntries);
  await seedOnboardingStoryScripts(prisma, snapshot.onboardingStoryScripts);
}

export async function syncAdminDefaultConfig(prisma, snapshot = ADMIN_DEFAULT_CONFIG) {
  await syncSiteSettings(prisma, snapshot.siteSettings);
  await syncSkillTraits(prisma, snapshot.skillTraits);
  await syncCharacters(prisma, snapshot.characters);
  await syncDecorations(prisma, snapshot.decorations);
  await syncCostumes(prisma, snapshot.costumes);
  await syncShopItems(prisma, snapshot.shopItems);
  await syncGachaPools(prisma, snapshot.gachaPools);
  await syncAchievementRewardAssets(prisma, snapshot.achievementRewardAssets);
  await syncAchievements(prisma, snapshot.achievements);
  await syncMusicTrackSettings(prisma, snapshot.musicTrackSettings);
  await syncStoryScripts(prisma, snapshot.storyScripts);
  await syncAnnouncementEntries(prisma, snapshot.announcementEntries);
  await syncOnboardingStoryScripts(prisma, snapshot.onboardingStoryScripts);
}

async function syncSiteSettings(prisma, rows = []) {
  if (!prisma?.siteSetting?.upsert) return;
  for (const row of rows) {
    await prisma.siteSetting.upsert({
      where: { key: row.key },
      create: { key: row.key, value: row.value },
      update: { value: row.value }
    });
  }
}

async function syncSkillTraits(prisma, rows = []) {
  if (!prisma?.skillTrait?.upsert) return;
  for (const row of rows) {
    const data = {
      name: row.name,
      definition: row.definition,
      sortOrder: row.sortOrder ?? 0
    };
    await prisma.skillTrait.upsert({
      where: { id: row.id },
      create: { id: row.id, ...data },
      update: data
    });
  }
}

async function syncCharacters(prisma, rows = []) {
  if (!prisma?.character?.findUnique || !prisma?.character?.create || !prisma?.character?.update) return;
  for (const row of rows) {
    const existing = await prisma.character.findUnique({ where: { slug: row.slug } });
    const data = characterData(row, { existing: Boolean(existing) });
    if (!existing) {
      await prisma.character.create({
        data: {
          slug: row.slug,
          ...data,
          ...(row.skill ? { skill: { create: skillCreateData(row.skill) } } : {})
        }
      });
      continue;
    }
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
  }
}

async function syncDecorations(prisma, rows = []) {
  if (!prisma?.decoration?.findUnique || !prisma?.decoration?.create || !prisma?.decoration?.update) return;
  for (const row of rows) {
    const existing = await prisma.decoration.findUnique({ where: { slug: row.slug } });
    const data = decorationData(row);
    if (!existing) {
      await prisma.decoration.create({ data: { slug: row.slug, ...data } });
      continue;
    }
    await prisma.decoration.update({ where: { slug: row.slug }, data });
  }
}

async function syncCostumes(prisma, rows = []) {
  if (!prisma?.costume?.findUnique || !prisma?.costume?.create || !prisma?.costume?.update) return;
  for (const row of rows) {
    const existing = await prisma.costume.findUnique({ where: { id: row.id } });
    const data = costumeData(row);
    if (!existing) {
      await prisma.costume.create({ data: { id: row.id, ...data } });
      continue;
    }
    await prisma.costume.update({ where: { id: row.id }, data });
  }
}

async function syncShopItems(prisma, rows = []) {
  if (!prisma?.shopItem?.findFirst || !prisma?.shopItem?.create || !prisma?.shopItem?.update) return;
  for (const row of rows) {
    const existing = await prisma.shopItem.findFirst({
      where: { category: row.category, targetId: row.targetId }
    });
    const data = shopItemData(row, { existing: Boolean(existing) });
    if (!existing) {
      await prisma.shopItem.create({ data });
      continue;
    }
    await prisma.shopItem.update({ where: { id: existing.id }, data });
  }
}

async function syncGachaPools(prisma, rows = []) {
  if (!prisma?.gachaPool?.findUnique || !prisma?.gachaPool?.create || !prisma?.gachaPool?.update) return;
  for (const row of rows) {
    const existing = await prisma.gachaPool.findUnique({ where: { id: row.id } });
    const data = gachaPoolData(row);
    if (!existing) {
      await prisma.gachaPool.create({
        data: {
          id: row.id,
          ...data,
          prizes: { create: gachaPrizeCreateData(row.prizes) }
        }
      });
      continue;
    }
    await prisma.gachaPool.update({ where: { id: row.id }, data });
    if (!prisma?.gachaPrize?.upsert) continue;
    for (const prize of row.prizes ?? []) {
      const prizeData = gachaPrizeData(prize);
      await prisma.gachaPrize.upsert({
        where: { id: prize.id },
        create: { id: prize.id, poolId: row.id, ...prizeData },
        update: { poolId: row.id, ...prizeData }
      });
    }
  }
}

async function syncAchievementRewardAssets(prisma, rows = []) {
  if (!prisma?.achievementRewardAsset?.upsert) return;
  for (const row of rows) {
    const data = achievementRewardAssetData(row);
    await prisma.achievementRewardAsset.upsert({
      where: { id: row.id },
      create: { id: row.id, ...data },
      update: data
    });
  }
}

async function syncAchievements(prisma, rows = []) {
  if (!prisma?.achievement?.upsert) return;
  for (const row of rows) {
    const data = achievementData(row);
    await prisma.achievement.upsert({
      where: { key: row.key },
      create: { id: row.id, key: row.key, ...data },
      update: data
    });
  }
}

async function syncMusicTrackSettings(prisma, rows = []) {
  if (!prisma?.musicTrackSetting?.upsert) return;
  for (const row of rows) {
    const data = { displayName: row.displayName ?? "" };
    await prisma.musicTrackSetting.upsert({
      where: { id: row.id },
      create: { id: row.id, ...data },
      update: data
    });
  }
}

async function syncStoryScripts(prisma, rows = []) {
  if (!prisma?.storyScript?.upsert) return;
  for (const row of rows) {
    const data = storyScriptData(row);
    await prisma.storyScript.upsert({
      where: { key: row.key },
      create: { id: row.id, key: row.key, ...data },
      update: data
    });
  }
}

async function syncAnnouncementEntries(prisma, rows = []) {
  if (!prisma?.announcementEntry?.upsert) return;
  for (const row of rows) {
    const data = announcementEntryData(row);
    await prisma.announcementEntry.upsert({
      where: { id: row.id },
      create: { id: row.id, ...data },
      update: data
    });
  }
}

async function syncOnboardingStoryScripts(prisma, rows = []) {
  if (!prisma?.onboardingStoryScript?.upsert) return;
  for (const row of rows) {
    const data = onboardingStoryScriptData(row);
    await prisma.onboardingStoryScript.upsert({
      where: { id: row.id },
      create: { id: row.id, ...data },
      update: data
    });
  }
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

async function seedCostumes(prisma, rows = []) {
  if (!prisma?.costume?.findUnique || !prisma?.costume?.create) return;
  for (const row of rows) {
    const existing = await prisma.costume.findUnique({ where: { id: row.id } });
    if (existing) continue;
    await prisma.costume.create({
      data: {
        id: row.id,
        ...costumeData(row)
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

function costumeData(row) {
  return {
    name: row.name,
    characterSlug: row.characterSlug,
    portraitUrl: row.portraitUrl,
    candyEffectPortraitUrl: row.candyEffectPortraitUrl ?? "",
    portraitScalePercent: row.portraitScalePercent ?? 100,
    portraitOffsetXPercent: row.portraitOffsetXPercent ?? 0,
    portraitOffsetYPercent: row.portraitOffsetYPercent ?? 0,
    description: row.description ?? "",
    illustName: row.illustName ?? "",
    illustUrl: row.illustUrl ?? "",
    priceCoins: row.priceCoins,
    discountPercent: row.discountPercent ?? 0,
    shopVisible: row.shopVisible !== false,
    purchasable: row.purchasable !== false,
    enabled: row.enabled !== false,
    sortOrder: row.sortOrder ?? 0,
    source: row.source ?? "default"
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
  return prizes.map((prize) => ({ id: prize.id, ...gachaPrizeData(prize) }));
}

function gachaPrizeData(prize) {
  return {
    type: prize.type,
    targetId: prize.targetId ?? "",
    quantity: prize.quantity,
    probabilityBasisPoints: prize.probabilityBasisPoints,
    enabled: prize.enabled !== false,
    name: prize.name ?? "",
    imageUrl: prize.imageUrl ?? "",
    sortOrder: prize.sortOrder ?? 0
  };
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
