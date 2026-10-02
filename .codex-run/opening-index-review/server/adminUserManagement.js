import bcrypt from "bcryptjs";
import { USER_ROLES, USER_STATUS } from "./adminConfig.js";
import { publicUser } from "./db.js";
import { normalizeOwnedItems, serializeOwnedItems } from "./items.js";
import { routeError } from "./adminRouteErrors.js";
import { writeAudit } from "./adminAudit.js";
import { serializeAssetList, syncStructuredUserAssets } from "./userAssets.js";
import {
  PROGRESS_METRICS,
  PROGRESS_REASONS,
  progressLedgerCreateOperations
} from "./userProgressLedger.js";

const EDITABLE_USER_FIELDS = new Set([
  "role",
  "rating",
  "coins",
  "ownedCharacters",
  "ownedItems",
  "selectedCharacter"
]);
const PRISMA_INT_MIN = -2147483648;
const PRISMA_INT_MAX = 2147483647;

export function sanitizeUserUpdate(body = {}) {
  const data = {};
  for (const [key, value] of Object.entries(body)) {
    if (!EDITABLE_USER_FIELDS.has(key)) continue;
    if (key === "role" && [USER_ROLES.player, USER_ROLES.admin].includes(value)) {
      data.role = value;
    }
    if (key === "rating") {
      const rating = parseIntegerInput(value);
      if (rating != null) data.rating = rating;
    }
    if (key === "coins") {
      const coins = parseIntegerInput(value);
      if (coins != null) data.coins = coins;
    }
    if (key === "ownedCharacters" && Array.isArray(value)) {
      const ownedCharacters = serializeAssetList(value.filter((character) => typeof character === "string"));
      if (ownedCharacters) data.ownedCharacters = ownedCharacters;
    }
    if (key === "ownedItems") {
      data.ownedItems = serializeOwnedItems(normalizeOwnedItems(value));
    }
    if (key === "selectedCharacter" && typeof value === "string") {
      const selectedCharacter = value.trim();
      if (selectedCharacter) data.selectedCharacter = selectedCharacter;
    }
  }
  return data;
}

export function requireUserUpdateData(data) {
  if (Object.keys(data).length > 0) return data;
  throw routeError(400, "没有可更新字段");
}

function shouldSyncStructuredAssets(data) {
  return Object.hasOwn(data, "ownedCharacters") || Object.hasOwn(data, "ownedItems") || Object.hasOwn(data, "ownedDecorations");
}

function adminProgressLedgerEntries(before, after, data) {
  const entries = [];
  if (Object.hasOwn(data, "coins")) {
    entries.push({
      userId: after.id,
      metric: PROGRESS_METRICS.coins,
      delta: Number(after.coins ?? 0) - Number(before.coins ?? 0),
      beforeValue: before.coins,
      afterValue: after.coins,
      reason: PROGRESS_REASONS.adminUpdate,
      refType: "adminUser",
      refId: ""
    });
  }
  if (Object.hasOwn(data, "rating")) {
    entries.push({
      userId: after.id,
      metric: PROGRESS_METRICS.rating,
      delta: Number(after.rating ?? 0) - Number(before.rating ?? 0),
      beforeValue: before.rating,
      afterValue: after.rating,
      reason: PROGRESS_REASONS.adminUpdate,
      refType: "adminUser",
      refId: ""
    });
  }
  return entries;
}

export async function updateUserProfile({ prisma, adminUser, userId, body }) {
  const data = requireUserUpdateData(sanitizeUserUpdate(body));
  const user = await prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({ where: { id: userId } });
    if (!before) throw routeError(404, "User not found");
    if (before.role === USER_ROLES.admin && data.role && data.role !== USER_ROLES.admin) {
      await assertNotLastActiveAdmin(tx, before.id);
    }
    const after = await tx.user.update({
      where: { id: userId },
      data
    });
    if (shouldSyncStructuredAssets(data)) {
      await syncStructuredUserAssets(tx, after);
    }
    await Promise.all(progressLedgerCreateOperations(tx, adminProgressLedgerEntries(before, after, data).map((entry) => ({
      ...entry,
      refId: adminUser?.id ?? ""
    }))));
    await writeAudit(tx, adminUser, "user.update", userId, publicUser(before), publicUser(after));
    return after;
  });
  return { user: publicUser(user) };
}

export async function banUser({ prisma, adminUser, userId, reason }) {
  const user = await prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({ where: { id: userId } });
    if (!before) throw routeError(404, "User not found");
    if (before.role === USER_ROLES.admin && before.status !== USER_STATUS.banned) {
      await assertNotLastActiveAdmin(tx, before.id);
    }
    const after = await tx.user.update({
      where: { id: userId },
      data: {
        status: USER_STATUS.banned,
        banReason: reason,
        bannedAt: new Date()
      }
    });
    await writeAudit(tx, adminUser, "user.ban", userId, publicUser(before), {
      ...publicUser(after),
      banReason: after.banReason,
      bannedAt: after.bannedAt
    });
    return after;
  });
  return { user: publicUser(user) };
}

export async function unbanUser({ prisma, adminUser, userId }) {
  const user = await prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({ where: { id: userId } });
    if (!before) throw routeError(404, "User not found");
    const after = await tx.user.update({
      where: { id: userId },
      data: {
        status: USER_STATUS.active,
        banReason: null,
        bannedAt: null
      }
    });
    await writeAudit(tx, adminUser, "user.unban", userId, {
      ...publicUser(before),
      banReason: before.banReason,
      bannedAt: before.bannedAt
    }, publicUser(after));
    return after;
  });
  return { user: publicUser(user) };
}

export async function resetUserPassword({ prisma, adminUser, userId, password }) {
  await prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({ where: { id: userId } });
    if (!before) throw routeError(404, "User not found");
    const passwordHash = await bcrypt.hash(password, 10);
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash }
    });
    await writeAudit(tx, adminUser, "user.reset-password", userId, { id: before.id }, { passwordReset: true });
  });
  return { ok: true };
}

function parseIntegerInput(value) {
  if (typeof value === "number") return isPrismaInt(value) ? value : null;
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value);
    return isPrismaInt(parsed) ? parsed : null;
  }
  return null;
}

function isPrismaInt(value) {
  return Number.isSafeInteger(value) && value >= PRISMA_INT_MIN && value <= PRISMA_INT_MAX;
}

async function assertNotLastActiveAdmin(prisma, userId) {
  const otherAdmins = await prisma.user.count({
    where: {
      id: { not: userId },
      role: USER_ROLES.admin,
      status: USER_STATUS.active
    }
  });
  if (otherAdmins <= 0) throw routeError(400, "Cannot remove the last active admin");
}
