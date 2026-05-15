import bcrypt from "bcryptjs";
import { Router } from "express";
import { USER_ROLES, USER_STATUS } from "./adminConfig.js";
import { publicUser } from "./db.js";

const EDITABLE_USER_FIELDS = new Set([
  "role",
  "status",
  "rank",
  "rating",
  "coins",
  "ownedCharacters",
  "selectedCharacter"
]);
const PRISMA_INT_MIN = -2147483648;
const PRISMA_INT_MAX = 2147483647;

export function serializeAudit(value) {
  if (value == null) return null;
  return JSON.stringify(value);
}

export function sanitizeUserUpdate(body = {}) {
  const data = {};
  for (const [key, value] of Object.entries(body)) {
    if (!EDITABLE_USER_FIELDS.has(key)) continue;
    if (key === "role" && [USER_ROLES.player, USER_ROLES.admin].includes(value)) {
      data.role = value;
    }
    if (key === "status" && [USER_STATUS.active, USER_STATUS.banned].includes(value)) {
      data.status = value;
    }
    if (key === "rank" && typeof value === "string") {
      const rank = value.trim().slice(0, 20);
      if (rank) data.rank = rank;
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
      const ownedCharacters = value
        .filter((character) => typeof character === "string")
        .map((character) => character.trim())
        .filter(Boolean)
        .join(",");
      if (ownedCharacters) data.ownedCharacters = ownedCharacters;
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

export async function updateUserProfile({ prisma, adminUser, userId, body }) {
  const data = requireUserUpdateData(sanitizeUserUpdate(body));
  const user = await prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({ where: { id: userId } });
    if (!before) throw routeError(404, "User not found");
    const after = await tx.user.update({
      where: { id: userId },
      data
    });
    await writeAudit(tx, adminUser, "user.update", userId, publicUser(before), publicUser(after));
    return after;
  });
  return { user: publicUser(user) };
}

export async function banUser({ prisma, adminUser, userId, reason }) {
  const user = await prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({ where: { id: userId } });
    if (!before) throw routeError(404, "User not found");
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

export function createAdminRouter({ prisma, uploadMiddleware = null }) {
  void uploadMiddleware;
  const router = Router();

  router.get("/summary", async (_req, res) => {
    const [users, bannedUsers, characters, gameRecords, auditLogs] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: USER_STATUS.banned } }),
      prisma.character.count({ where: { enabled: true } }),
      prisma.gameRecord.count(),
      prisma.adminAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8
      })
    ]);
    res.json({
      summary: { users, bannedUsers, characters, gameRecords },
      auditLogs
    });
  });

  router.get("/users", async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 200
    });
    res.json({ users: users.map(publicUser) });
  });

  router.get("/users/:id", async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user: publicUser(user) });
  });

  router.patch("/users/:id", async (req, res) => {
    try {
      res.json(await updateUserProfile({ prisma, adminUser: req.user, userId: req.params.id, body: req.body }));
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  router.post("/users/:id/ban", async (req, res) => {
    const reason = String(req.body.reason ?? "").trim();
    if (reason.length < 2) {
      res.status(400).json({ error: "Ban reason must be at least 2 characters" });
      return;
    }
    try {
      res.json(await banUser({ prisma, adminUser: req.user, userId: req.params.id, reason }));
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  router.post("/users/:id/unban", async (req, res) => {
    try {
      res.json(await unbanUser({ prisma, adminUser: req.user, userId: req.params.id }));
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  router.post("/users/:id/reset-password", async (req, res) => {
    const password = String(req.body.password ?? "");
    if (password.length < 4) {
      res.status(400).json({ error: "Password must be at least 4 characters" });
      return;
    }
    try {
      res.json(await resetUserPassword({ prisma, adminUser: req.user, userId: req.params.id, password }));
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  return router;
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

async function writeAudit(prisma, adminUser, action, targetId, before, after) {
  await prisma.adminAuditLog.create({
    data: {
      adminUserId: adminUser.id,
      action,
      targetType: "user",
      targetId,
      beforeJson: serializeAudit(before),
      afterJson: serializeAudit(after)
    }
  });
}

function routeError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function sendRouteError(res, error) {
  if (error.status) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  throw error;
}
