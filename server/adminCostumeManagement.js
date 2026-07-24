import { toCostumePayload } from "../src/shared/costumes.js";
import { writeAudit } from "./adminAudit.js";
import { routeError } from "./adminRouteErrors.js";

export async function assertCostumeCharacterExists(prisma, costume) {
  const character = await prisma.character.findUnique({ where: { slug: costume.characterSlug } });
  if (!character) throw routeError(400, "服装所属角色不存在");
}

export async function createCostume({ prisma, adminUser, input }) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.costume.findUnique({ where: { id: input.id } });
    if (existing) throw routeError(409, "Costume id already exists");
    const costume = await tx.costume.create({ data: input });
    await writeAudit(tx, adminUser, "costume.create", costume.id, null, toCostumePayload(costume), "costume");
    return costume;
  });
}

export async function updateCostume({ prisma, adminUser, costumeId, input }) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.costume.findUnique({ where: { id: costumeId } });
    if (!before) throw routeError(404, "Costume not found");
    const after = await tx.costume.update({ where: { id: costumeId }, data: input });
    if (!after.enabled || before.characterSlug !== after.characterSlug) {
      await tx.userCostumeEquipment.deleteMany({ where: { costumeId } });
    }
    await writeAudit(
      tx,
      adminUser,
      "costume.update",
      after.id,
      toCostumePayload(before),
      toCostumePayload(after),
      "costume"
    );
    return after;
  });
}
