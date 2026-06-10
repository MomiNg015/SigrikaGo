import { syncStructuredUserAssets } from "./userAssets.js";

export async function backfillStructuredUserAssets({
  prisma,
  batchSize = 100,
  syncUserAssets = syncStructuredUserAssets
} = {}) {
  if (!prisma?.user?.findMany) throw new Error("Prisma user client is required");
  const take = normalizeBatchSize(batchSize);
  let cursorId = null;
  let count = 0;

  while (true) {
    const users = await prisma.user.findMany({
      take,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      orderBy: { id: "asc" }
    });
    if (!users.length) break;

    for (const user of users) {
      await syncUserAssets(prisma, user);
      count += 1;
    }

    cursorId = users.at(-1).id;
    if (users.length < take) break;
  }

  return { count };
}

function normalizeBatchSize(value) {
  const size = Number(value);
  return Number.isSafeInteger(size) && size > 0 ? size : 100;
}
