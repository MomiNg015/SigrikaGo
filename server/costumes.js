import { canonicalCharacterId } from "../src/shared/characterAliases.js";
import {
  DEFAULT_COSTUME_ID,
  finalCostumePrice,
  normalizeCostumeId,
  toCostumePayload
} from "../src/shared/costumes.js";
import { publicUser, USER_ASSET_RELATION_INCLUDE } from "./db.js";
import { routeError } from "./adminRouteErrors.js";
import { publicUserAssets } from "./userAssets.js";
import {
  PROGRESS_METRICS,
  PROGRESS_REASONS,
  progressLedgerCreateOperation
} from "./userProgressLedger.js";

const COSTUME_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/u;

export async function ensureCostumeSchema(client) {
  if (!client?.$executeRawUnsafe) return;
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Costume" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "characterSlug" TEXT NOT NULL,
      "portraitUrl" TEXT NOT NULL,
      "candyEffectPortraitUrl" TEXT NOT NULL DEFAULT '',
      "description" TEXT NOT NULL DEFAULT '',
      "illustName" TEXT NOT NULL DEFAULT '',
      "illustUrl" TEXT NOT NULL DEFAULT '',
      "priceCoins" INTEGER NOT NULL,
      "discountPercent" INTEGER NOT NULL DEFAULT 0,
      "shopVisible" BOOLEAN NOT NULL DEFAULT true,
      "purchasable" BOOLEAN NOT NULL DEFAULT true,
      "enabled" BOOLEAN NOT NULL DEFAULT true,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "source" TEXT NOT NULL DEFAULT 'default',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserCostume" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "costumeId" TEXT NOT NULL,
      "source" TEXT NOT NULL DEFAULT 'purchase',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "UserCostume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "UserCostume_costumeId_fkey" FOREIGN KEY ("costumeId") REFERENCES "Costume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserCostumeEquipment" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "characterSlug" TEXT NOT NULL,
      "costumeId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "UserCostumeEquipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "UserCostumeEquipment_costumeId_fkey" FOREIGN KEY ("costumeId") REFERENCES "Costume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Costume_characterSlug_enabled_sortOrder_idx" ON "Costume"("characterSlug", "enabled", "sortOrder")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Costume_shopVisible_purchasable_enabled_sortOrder_idx" ON "Costume"("shopVisible", "purchasable", "enabled", "sortOrder")`);
  await client.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "UserCostume_userId_costumeId_key" ON "UserCostume"("userId", "costumeId")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UserCostume_costumeId_idx" ON "UserCostume"("costumeId")`);
  await client.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "UserCostumeEquipment_userId_characterSlug_key" ON "UserCostumeEquipment"("userId", "characterSlug")`);
  await client.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UserCostumeEquipment_costumeId_idx" ON "UserCostumeEquipment"("costumeId")`);
}

export function validateCostumeInput(input = {}, { requireId = true } = {}) {
  const errors = [];
  const id = normalizeCostumeId(input.id);
  const name = String(input.name ?? "").trim();
  const characterSlug = canonicalCharacterId(input.characterSlug);
  const portraitUrl = normalizeAssetUrl(input.portraitUrl, { required: true });
  const candyEffectPortraitUrl = normalizeAssetUrl(input.candyEffectPortraitUrl);
  const illustUrl = normalizeAssetUrl(input.illustUrl);
  const illustName = String(input.illustName ?? "").trim();
  const priceCoins = parseInteger(input.priceCoins, { min: 0 });
  const discountPercent = parseInteger(input.discountPercent ?? 0, { min: 0, max: 100 });
  const sortOrder = parseInteger(input.sortOrder ?? 0);
  const shopVisible = input.shopVisible ?? true;
  const purchasable = input.purchasable ?? true;
  const enabled = input.enabled ?? true;

  if (requireId && !COSTUME_ID_PATTERN.test(id)) errors.push("id must contain lowercase letters, numbers, or hyphens and be 2-64 characters");
  if (!name) errors.push("name is required");
  if (!characterSlug) errors.push("characterSlug is required");
  if (!portraitUrl) errors.push("portraitUrl must be an /assets path or an http(s) URL");
  if (input.candyEffectPortraitUrl && !candyEffectPortraitUrl) errors.push("candyEffectPortraitUrl must be an /assets path or an http(s) URL");
  if (input.illustUrl && !illustUrl) errors.push("illustUrl must be an /assets path or an http(s) URL");
  if (illustUrl && !illustName) errors.push("illustName is required when illustUrl is set");
  if (priceCoins == null) errors.push("priceCoins must be a non-negative integer");
  if (discountPercent == null) errors.push("discountPercent must be an integer from 0 to 100");
  if (sortOrder == null) errors.push("sortOrder must be an integer");
  if (typeof shopVisible !== "boolean") errors.push("shopVisible must be a boolean");
  if (typeof purchasable !== "boolean") errors.push("purchasable must be a boolean");
  if (typeof enabled !== "boolean") errors.push("enabled must be a boolean");
  if (errors.length) return { ok: false, error: errors.join("\n") };

  return {
    ok: true,
    value: {
      ...(requireId ? { id } : {}),
      name,
      characterSlug,
      portraitUrl,
      candyEffectPortraitUrl,
      description: String(input.description ?? "").trim(),
      illustName,
      illustUrl,
      priceCoins,
      discountPercent,
      shopVisible,
      purchasable,
      enabled,
      sortOrder,
      source: String(input.source ?? "admin").trim() || "admin"
    }
  };
}

export async function listCostumes({ prisma, userId }) {
  const [costumes, user] = await Promise.all([
    prisma.costume.findMany({
      where: { enabled: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }]
    }),
    prisma.user.findUnique({
      where: { id: userId },
      include: USER_ASSET_RELATION_INCLUDE
    })
  ]);
  if (!user) throw routeError(404, "用户不存在");
  const assets = publicUserAssets(user);
  const ownedIds = new Set(assets.ownedCostumeIds);
  const ownedCharacters = new Set(assets.ownedCharacters);
  return {
    costumes: costumes.map((costume) => ({
      ...toCostumePayload(costume),
      owned: ownedIds.has(costume.id),
      characterOwned: ownedCharacters.has(canonicalCharacterId(costume.characterSlug)),
      equipped: assets.equippedCostumes[costume.characterSlug]?.id === costume.id
    })),
    ownedCostumeIds: assets.ownedCostumeIds,
    equippedCostumes: assets.equippedCostumes
  };
}

export async function purchaseCostume({ prisma, userId, costumeId }) {
  return prisma.$transaction(async (tx) => {
    const [user, costume, ownership] = await Promise.all([
      tx.user.findUnique({
        where: { id: userId },
        include: USER_ASSET_RELATION_INCLUDE
      }),
      tx.costume.findUnique({ where: { id: normalizeCostumeId(costumeId) } }),
      tx.userCostume.findUnique({
        where: {
          userId_costumeId: {
            userId,
            costumeId: normalizeCostumeId(costumeId)
          }
        }
      })
    ]);
    if (!user) throw routeError(404, "用户不存在");
    if (!costume || !costume.enabled || !costume.shopVisible || !costume.purchasable) {
      throw routeError(400, "服装不可购买");
    }
    if (ownership) throw routeError(400, "已拥有该服装");
    if (!publicUserAssets(user).ownedCharacters.includes(canonicalCharacterId(costume.characterSlug))) {
      throw routeError(400, "需要先拥有对应角色");
    }

    const price = finalCostumePrice(costume);
    if (user.coins < price) throw routeError(400, "金币不足");
    const coinUpdate = await tx.user.updateMany({
      where: { id: userId, coins: { gte: price } },
      data: { coins: { decrement: price } }
    });
    if (coinUpdate.count !== 1) throw routeError(400, "金币不足");
    await tx.userCostume.create({
      data: {
        userId,
        costumeId: costume.id,
        source: "purchase"
      }
    });
    const updated = await tx.user.findUnique({
      where: { id: userId },
      include: USER_ASSET_RELATION_INCLUDE
    });
    await progressLedgerCreateOperation(tx, {
      userId,
      metric: PROGRESS_METRICS.coins,
      delta: -price,
      beforeValue: user.coins,
      afterValue: updated.coins,
      reason: PROGRESS_REASONS.costumePurchase,
      refType: "costume",
      refId: costume.id
    });
    return {
      user: publicUser(updated),
      costume: {
        ...toCostumePayload(costume),
        owned: true,
        characterOwned: true,
        equipped: false
      }
    };
  });
}

export async function equipCostume({ prisma, userId, characterSlug: rawCharacterSlug, costumeId: rawCostumeId }) {
  const characterSlug = canonicalCharacterId(rawCharacterSlug);
  const costumeId = normalizeCostumeId(rawCostumeId);
  if (!characterSlug) throw routeError(400, "角色不存在");

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: USER_ASSET_RELATION_INCLUDE
    });
    if (!user) throw routeError(404, "用户不存在");
    if (!publicUserAssets(user).ownedCharacters.includes(characterSlug)) {
      throw routeError(400, "尚未拥有该角色");
    }

    if (!costumeId || costumeId === DEFAULT_COSTUME_ID) {
      await tx.userCostumeEquipment.deleteMany({ where: { userId, characterSlug } });
    } else {
      const costume = await tx.costume.findUnique({ where: { id: costumeId } });
      if (!costume || !costume.enabled || canonicalCharacterId(costume.characterSlug) !== characterSlug) {
        throw routeError(400, "服装不可装扮");
      }
      const ownership = await tx.userCostume.findUnique({
        where: { userId_costumeId: { userId, costumeId } }
      });
      if (!ownership) throw routeError(400, "尚未拥有该服装");
      await tx.userCostumeEquipment.upsert({
        where: { userId_characterSlug: { userId, characterSlug } },
        create: { userId, characterSlug, costumeId },
        update: { costumeId }
      });
    }

    const updated = await tx.user.findUnique({
      where: { id: userId },
      include: USER_ASSET_RELATION_INCLUDE
    });
    return {
      user: publicUser(updated),
      characterSlug,
      costumeId: costumeId && costumeId !== DEFAULT_COSTUME_ID ? costumeId : DEFAULT_COSTUME_ID
    };
  });
}

export function normalizeAssetUrl(value, { required = false } = {}) {
  const text = String(value ?? "").trim();
  if (!text) return required ? "" : "";
  if (/^\/assets\/[^\s?#]+(?:\?[^\s#]*)?$/u.test(text)) return text;
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function parseInteger(value, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isSafeInteger(number) || number < min || number > max) return null;
  return number;
}
