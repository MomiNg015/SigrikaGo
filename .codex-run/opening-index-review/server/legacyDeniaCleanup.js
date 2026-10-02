export const CANONICAL_DENIA_SLUG = "denia";
export const LEGACY_DENIA_SLUGS = ["danea", "denea"];

const LEGACY_DENIA_SET = new Set(LEGACY_DENIA_SLUGS);

export function normalizeLegacyDeniaSlug(value) {
  const slug = String(value ?? "").trim();
  return LEGACY_DENIA_SET.has(slug) ? CANONICAL_DENIA_SLUG : slug;
}

export function isLegacyDeniaSlug(value) {
  return LEGACY_DENIA_SET.has(String(value ?? "").trim());
}

export function normalizeLegacyDeniaList(value) {
  const rawItems = Array.isArray(value)
    ? value
    : String(value ?? "").split(",");
  const seen = new Set();
  const result = [];
  for (const rawItem of rawItems) {
    const slug = normalizeLegacyDeniaSlug(rawItem);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    result.push(slug);
  }
  return result;
}

export async function cleanupLegacyDeniaCharacterData(prisma) {
  if (!prisma) return;
  await normalizeUserCharacterRows(prisma);
  await normalizeUserLegacyFields(prisma);
  await normalizeCatalogTargets(prisma);
  await prisma.gameRecord?.deleteMany?.({
    where: {
      OR: [
        { blackCharacter: { in: LEGACY_DENIA_SLUGS } },
        { whiteCharacter: { in: LEGACY_DENIA_SLUGS } }
      ]
    }
  });
  await prisma.character?.deleteMany?.({
    where: { slug: { in: LEGACY_DENIA_SLUGS } }
  });
}

async function normalizeUserCharacterRows(prisma) {
  if (!prisma.userCharacter?.findMany || !prisma.userCharacter?.upsert) {
    await prisma.userCharacter?.deleteMany?.({ where: { characterSlug: { in: LEGACY_DENIA_SLUGS } } });
    return;
  }

  const legacyRows = await prisma.userCharacter.findMany({
    where: { characterSlug: { in: LEGACY_DENIA_SLUGS } },
    select: { userId: true, chainCount: true }
  });
  if (!legacyRows.length) return;

  const userIds = [...new Set(legacyRows.map((row) => row.userId).filter(Boolean))];
  const canonicalRows = prisma.userCharacter.findMany
    ? await prisma.userCharacter.findMany({
        where: { userId: { in: userIds }, characterSlug: CANONICAL_DENIA_SLUG },
        select: { userId: true, chainCount: true }
      })
    : [];
  const chainCounts = new Map();
  for (const row of [...canonicalRows, ...legacyRows]) {
    const chainCount = Math.max(0, Number(row.chainCount ?? 0) || 0);
    chainCounts.set(row.userId, Math.max(chainCounts.get(row.userId) ?? 0, chainCount));
  }

  for (const userId of userIds) {
    await prisma.userCharacter.upsert({
      where: { userId_characterSlug: { userId, characterSlug: CANONICAL_DENIA_SLUG } },
      create: {
        userId,
        characterSlug: CANONICAL_DENIA_SLUG,
        chainCount: chainCounts.get(userId) ?? 0,
        source: "legacy"
      },
      update: {
        chainCount: chainCounts.get(userId) ?? 0
      }
    });
  }

  await prisma.userCharacter.deleteMany?.({
    where: { characterSlug: { in: LEGACY_DENIA_SLUGS } }
  });
}

async function normalizeUserLegacyFields(prisma) {
  if (!prisma.user?.findMany || !prisma.user?.update) return;
  const users = await prisma.user.findMany({
    select: { id: true, selectedCharacter: true, ownedCharacters: true }
  });
  for (const user of users) {
    const selectedCharacter = normalizeLegacyDeniaSlug(user.selectedCharacter);
    const ownedCharacters = normalizeLegacyDeniaList(user.ownedCharacters).join(",");
    const data = {};
    if (selectedCharacter !== user.selectedCharacter) data.selectedCharacter = selectedCharacter;
    if (ownedCharacters !== String(user.ownedCharacters ?? "")) data.ownedCharacters = ownedCharacters;
    if (Object.keys(data).length) {
      await prisma.user.update({ where: { id: user.id }, data });
    }
  }
}

async function normalizeCatalogTargets(prisma) {
  await prisma.shopItem?.updateMany?.({
    where: { category: "character", targetId: { in: LEGACY_DENIA_SLUGS } },
    data: { targetId: CANONICAL_DENIA_SLUG }
  });
  await prisma.gachaPrize?.updateMany?.({
    where: { type: "character", targetId: { in: LEGACY_DENIA_SLUGS } },
    data: { targetId: CANONICAL_DENIA_SLUG }
  });
  await prisma.gachaDrawReward?.updateMany?.({
    where: { type: "character", targetId: { in: LEGACY_DENIA_SLUGS } },
    data: { targetId: CANONICAL_DENIA_SLUG }
  });
  await prisma.achievementRewardAsset?.updateMany?.({
    where: { type: "character", targetId: { in: LEGACY_DENIA_SLUGS } },
    data: { targetId: CANONICAL_DENIA_SLUG }
  });
}
