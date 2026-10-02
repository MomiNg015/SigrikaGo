import { getStoneDecoration } from "../src/shared/stoneDecorations.js";
import { MUSIC_TRACKS } from "../src/shared/musicLibrary.js";
import { routeError } from "./adminRouteErrors.js";
import { writeAudit } from "./adminAudit.js";
import { toShopItemPayload } from "./shop.js";

export async function createDecoration({ prisma, adminUser, input }) {
  return prisma.$transaction(async (tx) => {
    const decoration = await tx.decoration.create({ data: input });
    await writeAudit(tx, adminUser, "decoration.create", decoration.slug, null, decoration, "decoration");
    return decoration;
  });
}

export async function updateDecoration({ prisma, adminUser, decorationId, input }) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.decoration.findUnique({ where: { id: decorationId } });
    if (!before) throw routeError(404, "Decoration not found");
    const after = await tx.decoration.update({ where: { id: decorationId }, data: input });
    await writeAudit(tx, adminUser, "decoration.update", after.slug, before, after, "decoration");
    return after;
  });
}

export async function disableDecoration({ prisma, adminUser, decorationId }) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.decoration.findUnique({ where: { id: decorationId } });
    if (!before) throw routeError(404, "Decoration not found");
    const after = await tx.decoration.update({ where: { id: decorationId }, data: { enabled: false } });
    await writeAudit(tx, adminUser, "decoration.disable", after.slug, before, after, "decoration");
    return after;
  });
}

export async function createShopItem({ prisma, adminUser, input }) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.shopItem.create({ data: input });
    await writeAudit(tx, adminUser, "shop-item.create", item.id, null, toShopItemPayload(item), "shop-item");
    return item;
  });
}

export async function updateShopItem({ prisma, adminUser, itemId, input }) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.shopItem.findUnique({ where: { id: itemId } });
    if (!before) throw routeError(404, "Shop item not found");
    const after = await tx.shopItem.update({ where: { id: itemId }, data: input });
    await writeAudit(
      tx,
      adminUser,
      "shop-item.update",
      after.id,
      toShopItemPayload(before),
      toShopItemPayload(after),
      "shop-item"
    );
    return after;
  });
}

export async function disableShopItem({ prisma, adminUser, itemId }) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.shopItem.findUnique({ where: { id: itemId } });
    if (!before) throw routeError(404, "Shop item not found");
    const after = await tx.shopItem.update({ where: { id: itemId }, data: { enabled: false } });
    await writeAudit(
      tx,
      adminUser,
      "shop-item.disable",
      after.id,
      toShopItemPayload(before),
      toShopItemPayload(after),
      "shop-item"
    );
    return after;
  });
}

export async function assertShopTargetExists(prisma, item) {
  if (item.category === "character") {
    const character = await prisma.character.findUnique({ where: { slug: item.targetId } });
    if (!character) throw routeError(400, "Shop character target does not exist");
    return;
  }
  if (item.category === "decoration") {
    const decoration = await prisma.decoration.findUnique({ where: { slug: item.targetId } });
    if (!decoration && !getStoneDecoration(item.targetId)) {
      throw routeError(400, "Shop decoration target does not exist");
    }
    return;
  }
  if (item.category === "music") {
    if (!MUSIC_TRACKS[item.targetId]) throw routeError(400, "Shop music target does not exist");
  }
}
