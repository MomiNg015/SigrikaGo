import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { ADMIN_DEFAULT_CONFIG } from "../server/adminDefaultSnapshot.js";
import { seedAdminDefaultConfig } from "../server/adminDefaultSeed.js";
import { buildAdminDefaultConfig } from "./export-admin-default-snapshot.mjs";
import { preparePlaywrightTestDatabase } from "./playwrightTestDatabase.mjs";

export function mismatchedAdminDefaultDomains(localConfig, snapshot = ADMIN_DEFAULT_CONFIG) {
  const domains = new Set([...Object.keys(localConfig ?? {}), ...Object.keys(snapshot ?? {})]);
  return [...domains].filter((domain) => (
    JSON.stringify(localConfig?.[domain] ?? []) !== JSON.stringify(snapshot?.[domain] ?? [])
  ));
}

export async function verifyAdminDefaultSnapshot({ isolated = false } = {}) {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const temporary = isolated ? await preparePlaywrightTestDatabase({
    label: "admin-snapshot-check", port: 0, runId: randomUUID(), manageSignals: false
  }) : null;
  const prisma = new PrismaClient(temporary ? { datasources: { db: { url: temporary.databaseUrl } } } : {});
  try {
    if (isolated) await seedAdminDefaultConfig(prisma);
    const localConfig = await buildAdminDefaultConfig(prisma);
    const mismatches = mismatchedAdminDefaultDomains(localConfig);
    if (!mismatches.length) {
      console.log(isolated
        ? "Committed admin snapshot round-trip passed in disposable SQLite."
        : "Committed admin snapshot matches the local non-user admin configuration.");
      return;
    }
    throw new Error(
      isolated
        ? `Committed admin snapshot failed round-trip in: ${mismatches.join(", ")}.`
        : `Committed admin snapshot is stale in: ${mismatches.join(", ")}. Run npm run admin:snapshot and commit the result.`
    );
  } finally {
    await prisma.$disconnect();
    temporary?.cleanup();
    if (isolated) {
      if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previousDatabaseUrl;
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  verifyAdminDefaultSnapshot({ isolated: process.argv.includes("--isolated") }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
