import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";
import { ADMIN_DEFAULT_CONFIG } from "../server/adminDefaultSnapshot.js";
import { buildAdminDefaultConfig } from "./export-admin-default-snapshot.mjs";

export function mismatchedAdminDefaultDomains(localConfig, snapshot = ADMIN_DEFAULT_CONFIG) {
  const domains = new Set([...Object.keys(localConfig ?? {}), ...Object.keys(snapshot ?? {})]);
  return [...domains].filter((domain) => (
    JSON.stringify(localConfig?.[domain] ?? []) !== JSON.stringify(snapshot?.[domain] ?? [])
  ));
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const localConfig = await buildAdminDefaultConfig(prisma);
    const mismatches = mismatchedAdminDefaultDomains(localConfig);
    if (!mismatches.length) {
      console.log("Committed admin snapshot matches the local non-user admin configuration.");
      return;
    }
    throw new Error(
      `Committed admin snapshot is stale in: ${mismatches.join(", ")}. Run npm run admin:snapshot and commit the result.`
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
