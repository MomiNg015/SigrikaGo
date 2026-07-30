import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";
import { ensureServerSchema } from "../server/serverStartup.js";

export async function ensureProductionSchema(prisma) {
  await ensureServerSchema({ prisma });
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await ensureProductionSchema(prisma);
    console.log("Production schema compatibility OK");
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
