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
    if (key === "rank") {
      data.rank = String(value ?? "").trim().slice(0, 20);
    }
    if (key === "rating") {
      const rating = Number(value);
      if (Number.isFinite(rating)) data.rating = rating;
    }
    if (key === "coins") {
      const coins = Number(value);
      if (Number.isFinite(coins)) data.coins = coins;
    }
    if (key === "ownedCharacters" && Array.isArray(value)) {
      data.ownedCharacters = value.map((character) => String(character).trim()).filter(Boolean).join(",");
    }
    if (key === "selectedCharacter") {
      data.selectedCharacter = String(value ?? "").trim();
    }
  }
  return data;
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
    const before = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!before) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const data = sanitizeUserUpdate(req.body);
    const after = await prisma.user.update({
      where: { id: req.params.id },
      data
    });
    await writeAudit(prisma, req.user, "user.update", req.params.id, publicUser(before), publicUser(after));
    res.json({ user: publicUser(after) });
  });

  router.post("/users/:id/ban", async (req, res) => {
    const reason = String(req.body.reason ?? "").trim();
    if (reason.length < 2) {
      res.status(400).json({ error: "Ban reason must be at least 2 characters" });
      return;
    }
    const before = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!before) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const after = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        status: USER_STATUS.banned,
        banReason: reason,
        bannedAt: new Date()
      }
    });
    await writeAudit(prisma, req.user, "user.ban", req.params.id, publicUser(before), {
      ...publicUser(after),
      banReason: after.banReason,
      bannedAt: after.bannedAt
    });
    res.json({ user: publicUser(after) });
  });

  router.post("/users/:id/unban", async (req, res) => {
    const before = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!before) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const after = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        status: USER_STATUS.active,
        banReason: null,
        bannedAt: null
      }
    });
    await writeAudit(prisma, req.user, "user.unban", req.params.id, {
      ...publicUser(before),
      banReason: before.banReason,
      bannedAt: before.bannedAt
    }, publicUser(after));
    res.json({ user: publicUser(after) });
  });

  router.post("/users/:id/reset-password", async (req, res) => {
    const password = String(req.body.password ?? "");
    if (password.length < 4) {
      res.status(400).json({ error: "Password must be at least 4 characters" });
      return;
    }
    const before = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!before) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash }
    });
    await writeAudit(prisma, req.user, "user.reset-password", req.params.id, { id: before.id }, { passwordReset: true });
    res.json({ ok: true });
  });

  return router;
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
