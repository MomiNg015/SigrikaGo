import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DEFAULT_OUTPUT = "server/adminDefaultSnapshot.js";

export async function buildAdminDefaultConfig(prisma) {
  const [
    siteSettings,
    skillTraits,
    characters,
    decorations,
    shopItems,
    gachaPools,
    achievementRewardAssets,
    achievements,
    musicTrackSettings,
    storyScripts,
    announcementEntries,
    onboardingStoryScripts
  ] = await Promise.all([
    prisma.siteSetting.findMany({
      select: { key: true, value: true },
      orderBy: { key: "asc" }
    }),
    prisma.skillTrait.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }]
    }),
    prisma.character.findMany({
      include: { skill: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { slug: "asc" }]
    }),
    prisma.decoration.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { slug: "asc" }]
    }),
    prisma.shopItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { category: "asc" }, { targetId: "asc" }]
    }),
    prisma.gachaPool.findMany({
      include: {
        prizes: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }]
        }
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }]
    }),
    prisma.achievementRewardAsset.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }]
    }),
    prisma.achievement.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { key: "asc" }]
    }),
    prisma.musicTrackSetting.findMany({
      orderBy: { id: "asc" }
    }),
    prisma.storyScript.findMany({
      orderBy: [{ triggerType: "asc" }, { key: "asc" }]
    }),
    prisma.announcementEntry.findMany({
      where: { deletedAt: null },
      orderBy: [{ kind: "asc" }, { isPublished: "desc" }, { pinned: "desc" }, { createdAt: "asc" }, { id: "asc" }]
    }),
    prisma.onboardingStoryScript.findMany({
      orderBy: { id: "asc" }
    })
  ]);

  return {
    siteSettings: siteSettings.map(siteSettingSnapshot),
    skillTraits: skillTraits.map(skillTraitSnapshot),
    characters: characters.map(characterSnapshot),
    decorations: decorations.map(decorationSnapshot),
    shopItems: shopItems.map(shopItemSnapshot),
    gachaPools: gachaPools.map(gachaPoolSnapshot),
    achievementRewardAssets: achievementRewardAssets.map(achievementRewardAssetSnapshot),
    achievements: achievements.map(achievementSnapshot),
    musicTrackSettings: musicTrackSettings.map(musicTrackSettingSnapshot),
    storyScripts: storyScripts.map(storyScriptSnapshot),
    announcementEntries: announcementEntries.map(announcementEntrySnapshot),
    onboardingStoryScripts: onboardingStoryScripts.map(onboardingStoryScriptSnapshot)
  };
}

export function renderAdminDefaultSnapshot(config, { generatedAt = new Date() } = {}) {
  const generatedDate = isoDate(generatedAt).slice(0, 10);
  return [
    `// Generated from prisma/dev.db non-user admin configuration on ${generatedDate}.`,
    "// Do not include users, audit logs, feedback, reports, game records, mailbox batches/history, or live state here.",
    "",
    `export const ADMIN_DEFAULT_CONFIG = ${JSON.stringify(config, null, 2)};`,
    ""
  ].join("\n");
}

function siteSettingSnapshot(row) {
  return pick(row, ["key", "value"]);
}

function skillTraitSnapshot(row) {
  return pick(row, ["id", "name", "definition", "sortOrder"]);
}

function characterSnapshot(row) {
  const snapshot = pick(row, [
    "slug",
    "name",
    "description",
    "portraitUrl",
    "portraitSource",
    "acquisitionMethod",
    "cvName",
    "cvUrl",
    "source",
    "palette",
    "enabled",
    "sortOrder"
  ]);
  if (row.skill) snapshot.skill = characterSkillSnapshot(row.skill);
  return snapshot;
}

function characterSkillSnapshot(row) {
  return pick(row, [
    "effectType",
    "name",
    "description",
    "uses",
    "freeTurn",
    "targetRule",
    "paramsJson",
    "costType",
    "costValue",
    "systemMessage",
    "enabled"
  ]);
}

function decorationSnapshot(row) {
  return pick(row, ["slug", "name", "description", "imageUrl", "source", "enabled", "sortOrder"]);
}

function shopItemSnapshot(row) {
  return pick(row, [
    "name",
    "category",
    "targetId",
    "itemTargetType",
    "stockQuantity",
    "priceCoins",
    "discountPercent",
    "purchasable",
    "enabled",
    "sortOrder",
    "description",
    "imageUrl",
    "illustName",
    "illustUrl",
    "source"
  ]);
}

function gachaPoolSnapshot(row) {
  return {
    ...pick(row, [
      "id",
      "name",
      "description",
      "enabled",
      "permanent",
      "singleDrawPrice",
      "tenDrawPrice",
      "featuredPrizeId",
      "featuredPrizeIds",
      "sortOrder"
    ]),
    startsAt: nullableIsoDate(row.startsAt),
    endsAt: nullableIsoDate(row.endsAt),
    prizes: (row.prizes ?? []).map(gachaPrizeSnapshot)
  };
}

function gachaPrizeSnapshot(row) {
  return pick(row, [
    "id",
    "type",
    "targetId",
    "quantity",
    "probabilityBasisPoints",
    "enabled",
    "name",
    "imageUrl",
    "sortOrder"
  ]);
}

function achievementRewardAssetSnapshot(row) {
  return {
    ...pick(row, [
      "id",
      "type",
      "name",
      "description",
      "imageUrl",
      "text",
      "targetType",
      "targetId",
      "amount",
      "enabled",
      "sortOrder"
    ]),
    deletedAt: nullableIsoDate(row.deletedAt)
  };
}

function achievementSnapshot(row) {
  return {
    ...pick(row, [
      "id",
      "key",
      "name",
      "content",
      "conditionType",
      "conditionParams",
      "rewardAssetId",
      "enabled",
      "sortOrder"
    ]),
    deletedAt: nullableIsoDate(row.deletedAt)
  };
}

function musicTrackSettingSnapshot(row) {
  return pick(row, ["id", "displayName"]);
}

function storyScriptSnapshot(row) {
  return {
    ...pick(row, [
      "id",
      "key",
      "title",
      "triggerType",
      "triggerParamsJson",
      "draftStartNodeId",
      "draftInitialBoardJson",
      "draftNodesJson",
      "isPublished",
      "publishedStartNodeId",
      "publishedInitialBoardJson",
      "publishedNodesJson"
    ]),
    firstPublishedAt: nullableIsoDate(row.firstPublishedAt),
    publishedAt: nullableIsoDate(row.publishedAt)
  };
}

function announcementEntrySnapshot(row) {
  return {
    ...pick(row, [
      "id",
      "kind",
      "title",
      "body",
      "isPublished",
      "pinned"
    ]),
    firstPublishedAt: nullableIsoDate(row.firstPublishedAt),
    deletedAt: nullableIsoDate(row.deletedAt)
  };
}

function onboardingStoryScriptSnapshot(row) {
  return {
    ...pick(row, [
      "id",
      "draftStartNodeId",
      "draftNodesJson",
      "isPublished",
      "publishedStartNodeId",
      "publishedNodesJson"
    ]),
    firstPublishedAt: nullableIsoDate(row.firstPublishedAt),
    publishedAt: nullableIsoDate(row.publishedAt)
  };
}

function pick(row, keys) {
  return Object.fromEntries(keys.map((key) => [key, row[key]]));
}

function nullableIsoDate(value) {
  if (value == null) return null;
  return isoDate(value);
}

function isoDate(value) {
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

async function main() {
  const outputArgIndex = process.argv.indexOf("--output");
  const output = outputArgIndex >= 0 ? process.argv[outputArgIndex + 1] : DEFAULT_OUTPUT;
  if (!output) throw new Error("--output requires a file path");

  const prisma = new PrismaClient();
  try {
    const config = await buildAdminDefaultConfig(prisma);
    const rendered = renderAdminDefaultSnapshot(config);
    const outputPath = path.resolve(process.cwd(), output);
    await writeFile(outputPath, rendered, "utf8");
    console.log(`Wrote ${path.relative(process.cwd(), outputPath)}`);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
