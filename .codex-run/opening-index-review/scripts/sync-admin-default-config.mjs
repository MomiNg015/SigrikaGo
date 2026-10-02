import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";
import { syncAdminDefaultConfig } from "../server/adminDefaultSeed.js";
import { ADMIN_DEFAULT_CONFIG } from "../server/adminDefaultSnapshot.js";
import { buildAdminDefaultConfig } from "./export-admin-default-snapshot.mjs";

const DOMAIN_KEYS = Object.freeze({
  siteSettings: (row) => row.key,
  skillTraits: (row) => row.id,
  characters: (row) => row.slug,
  decorations: (row) => row.slug,
  costumes: (row) => row.id,
  shopItems: (row) => `${row.category}:${row.targetId}`,
  gachaPools: (row) => row.id,
  achievementRewardAssets: (row) => row.id,
  achievements: (row) => row.key,
  musicTrackSettings: (row) => row.id,
  storyScripts: (row) => row.key,
  announcementEntries: (row) => row.id,
  onboardingStoryScripts: (row) => row.id
});

export function buildAdminDefaultSyncPlan(currentConfig, desiredConfig = ADMIN_DEFAULT_CONFIG) {
  return Object.fromEntries(Object.entries(DOMAIN_KEYS).map(([domain, keyFor]) => {
    const currentRows = currentConfig?.[domain] ?? [];
    const desiredRows = desiredConfig?.[domain] ?? [];
    const currentByKey = new Map(currentRows.map((row) => [keyFor(row), row]));
    const desiredKeys = new Set(desiredRows.map(keyFor));
    let create = 0;
    let update = 0;
    let unchanged = 0;
    for (const row of desiredRows) {
      const key = keyFor(row);
      const current = currentByKey.get(key);
      if (!current) create += 1;
      else if (JSON.stringify(current) !== JSON.stringify(row)) update += 1;
      else unchanged += 1;
    }
    return [domain, {
      create,
      update,
      unchanged,
      preservedCloudOnly: currentRows.filter((row) => !desiredKeys.has(keyFor(row))).length
    }];
  }));
}

export function hasAdminDefaultSyncChanges(plan) {
  return Object.values(plan).some(({ create, update }) => create > 0 || update > 0);
}

async function main() {
  const apply = process.argv.includes("--apply");
  const prisma = new PrismaClient();
  try {
    const current = await buildAdminDefaultConfig(prisma);
    const plan = buildAdminDefaultSyncPlan(current);
    console.log(JSON.stringify(plan, null, 2));
    if (!apply) {
      console.log("Preview only. Re-run with --apply to synchronize committed non-user admin configuration.");
      return;
    }
    await prisma.$transaction(
      async (tx) => syncAdminDefaultConfig(tx, ADMIN_DEFAULT_CONFIG),
      { timeout: 30000 }
    );
    console.log(hasAdminDefaultSyncChanges(plan)
      ? "Applied committed non-user admin configuration."
      : "Committed non-user admin configuration was already synchronized.");
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
