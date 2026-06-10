import { prisma } from "../server/db.js";
import { backfillStructuredUserAssets } from "../server/userAssetsBackfill.js";

try {
  const result = await backfillStructuredUserAssets({ prisma });
  console.log(`Backfilled structured assets for ${result.count} users.`);
} finally {
  await prisma.$disconnect();
}
