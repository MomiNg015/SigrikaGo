import "dotenv/config";
import { fileURLToPath } from "node:url";
import { prisma } from "../server/db.js";
import { ADMIN_DEFAULT_CONFIG } from "../server/adminDefaultSnapshot.js";

export async function syncAdminDefaultStory({
  prisma: client,
  key,
  snapshot = ADMIN_DEFAULT_CONFIG,
  apply = false,
  force = false
}) {
  const normalizedKey = String(key ?? "").trim();
  if (!normalizedKey) throw new Error("A story key is required");

  const source = (snapshot.storyScripts ?? []).find((row) => row.key === normalizedKey);
  if (!source) throw new Error(`Story script is missing from the committed snapshot: ${normalizedKey}`);

  const existing = await client.storyScript.findUnique({ where: { key: normalizedKey } });
  const changed = !existing || storyScriptFingerprint(existing) !== storyScriptFingerprint(source);
  const existingPublishedAt = timestamp(existing?.publishedAt);
  const sourcePublishedAt = timestamp(source.publishedAt);
  if (changed && existingPublishedAt > sourcePublishedAt && !force) {
    throw new Error(
      `Database story ${normalizedKey} is newer than the committed snapshot; rerun with --force only after reviewing the cloud edit`
    );
  }

  if (!apply || !changed) {
    return {
      key: normalizedKey,
      applied: false,
      changed,
      existed: Boolean(existing),
      publishedAt: source.publishedAt ?? null
    };
  }

  const data = storyScriptWriteData(source);
  if (existing) {
    await client.storyScript.update({ where: { key: normalizedKey }, data });
  } else {
    await client.storyScript.create({
      data: {
        id: source.id,
        key: source.key,
        ...data
      }
    });
  }

  return {
    key: normalizedKey,
    applied: true,
    changed: true,
    existed: Boolean(existing),
    publishedAt: source.publishedAt ?? null
  };
}

export function storyScriptWriteData(row) {
  return {
    title: row.title ?? "",
    triggerType: row.triggerType,
    triggerParamsJson: row.triggerParamsJson ?? "{}",
    draftStartNodeId: row.draftStartNodeId ?? "",
    draftInitialBoardJson: row.draftInitialBoardJson ?? "",
    draftNodesJson: row.draftNodesJson ?? "[]",
    isPublished: row.isPublished === true,
    publishedStartNodeId: row.publishedStartNodeId ?? "",
    publishedInitialBoardJson: row.publishedInitialBoardJson ?? "",
    publishedNodesJson: row.publishedNodesJson ?? "[]",
    firstPublishedAt: nullableDate(row.firstPublishedAt),
    publishedAt: nullableDate(row.publishedAt)
  };
}

function storyScriptFingerprint(row) {
  return JSON.stringify({
    ...storyScriptWriteData(row),
    firstPublishedAt: timestamp(row.firstPublishedAt),
    publishedAt: timestamp(row.publishedAt)
  });
}

function nullableDate(value) {
  if (value == null || value === "") return null;
  return value instanceof Date ? value : new Date(value);
}

function timestamp(value) {
  if (value == null || value === "") return 0;
  const result = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(result) ? result : 0;
}

async function main() {
  const key = valueAfter("--key");
  if (!key) throw new Error("Usage: npm run admin:sync-onboarding [-- --apply] (missing --key)");

  try {
    const result = await syncAdminDefaultStory({
      prisma,
      key,
      apply: process.argv.includes("--apply"),
      force: process.argv.includes("--force")
    });
    if (!result.changed) {
      console.log(`[admin-story-sync] ${result.key} already matches the committed snapshot.`);
    } else if (result.applied) {
      console.log(`[admin-story-sync] Applied ${result.key} (${result.publishedAt ?? "unpublished"}).`);
    } else {
      console.log(`[admin-story-sync] Preview: ${result.key} will be ${result.existed ? "updated" : "created"}.`);
      console.log("[admin-story-sync] Rerun with --apply after backing up the production database.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

function valueAfter(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
