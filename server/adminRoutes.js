import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { Router } from "express";
import { USER_ROLES, USER_STATUS } from "./adminConfig.js";
import { toCharacterPayload, validateCharacterInput } from "./characters.js";
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
const ALLOWED_UPLOAD_TYPES = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"]
]);

export function serializeAudit(value) {
  if (value == null) return null;
  return JSON.stringify(value);
}

export function safeUploadFilename(originalName, mimeType) {
  const extension = ALLOWED_UPLOAD_TYPES.get(mimeType);
  if (!extension) throw routeError(400, "Unsupported image type");
  const stem = String(originalName ?? "")
    .replace(/\.[^.]*$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return `character-${crypto.randomUUID()}-${stem || "portrait"}${extension}`;
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

  router.get("/characters", async (_req, res) => {
    const characters = await prisma.character.findMany({
      include: { skill: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });
    res.json({ characters: characters.map(toCharacterPayload) });
  });

  router.post("/characters", async (req, res) => {
    const validated = validateCharacterInput(req.body);
    if (!validated.ok) {
      res.status(400).json({ error: validated.error });
      return;
    }
    try {
      const character = await createCharacter({ prisma, adminUser: req.user, input: validated.value });
      res.json({ character: toCharacterPayload(character) });
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  router.patch("/characters/:id", async (req, res) => {
    try {
      const character = await updateCharacter({
        prisma,
        adminUser: req.user,
        characterId: req.params.id,
        body: req.body
      });
      res.json({ character: toCharacterPayload(character) });
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  router.delete("/characters/:id", async (req, res) => {
    try {
      const character = await disableCharacter({
        prisma,
        adminUser: req.user,
        characterId: req.params.id
      });
      res.json({ character: toCharacterPayload(character) });
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  if (uploadMiddleware) {
    router.post("/uploads/character-portrait", uploadMiddleware.single("portrait"), (req, res) => {
      if (!req.file) {
        res.status(400).json({ error: "portrait file is required" });
        return;
      }
      res.json({ url: `/uploads/characters/${req.file.filename}` });
    });
  }

  return router;
}

async function createCharacter({ prisma, adminUser, input }) {
  return prisma.$transaction(async (tx) => {
    const character = await tx.character.create({
      data: characterCreateData(input),
      include: { skill: true }
    });
    await writeAudit(tx, adminUser, "character.create", character.slug, null, toCharacterPayload(character), "character");
    return character;
  });
}

async function updateCharacter({ prisma, adminUser, characterId, body }) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.character.findFirst({
      where: { OR: [{ id: characterId }, { slug: characterId }] },
      include: { skill: true }
    });
    if (!before) throw routeError(404, "Character not found");

    const validated = validateCharacterInput(mergeCharacterInput(before, body));
    if (!validated.ok) throw routeError(400, validated.error);

    const after = await tx.character.update({
      where: { id: before.id },
      data: characterUpdateData(validated.value),
      include: { skill: true }
    });
    await writeAudit(
      tx,
      adminUser,
      "character.update",
      after.slug,
      toCharacterPayload(before),
      toCharacterPayload(after),
      "character"
    );
    return after;
  });
}

async function disableCharacter({ prisma, adminUser, characterId }) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.character.findFirst({
      where: { OR: [{ id: characterId }, { slug: characterId }] },
      include: { skill: true }
    });
    if (!before) throw routeError(404, "Character not found");
    const after = await tx.character.update({
      where: { id: before.id },
      data: { enabled: false },
      include: { skill: true }
    });
    await writeAudit(
      tx,
      adminUser,
      "character.disable",
      after.slug,
      toCharacterPayload(before),
      toCharacterPayload(after),
      "character"
    );
    return after;
  });
}

function characterCreateData(input) {
  return {
    slug: input.slug,
    name: input.name,
    portraitUrl: input.portraitUrl,
    palette: input.palette,
    enabled: input.enabled,
    sortOrder: input.sortOrder,
    skill: {
      create: skillData(input.skill)
    }
  };
}

function characterUpdateData(input) {
  return {
    slug: input.slug,
    name: input.name,
    portraitUrl: input.portraitUrl,
    palette: input.palette,
    enabled: input.enabled,
    sortOrder: input.sortOrder,
    skill: {
      upsert: {
        create: skillData(input.skill),
        update: skillData(input.skill)
      }
    }
  };
}

function skillData(skill) {
  return {
    effectType: skill.effectType,
    name: skill.name,
    description: skill.description,
    uses: skill.uses,
    freeTurn: skill.freeTurn,
    targetRule: skill.targetRule,
    paramsJson: skill.paramsJson,
    enabled: true
  };
}

function mergeCharacterInput(record, body = {}) {
  const current = characterRecordToInput(record);
  const incoming = isPlainObject(body) ? body : {};
  const incomingSkill = {
    ...legacySkillInput(incoming),
    ...(isPlainObject(incoming.skill) ? incoming.skill : {})
  };
  return {
    ...current,
    ...incoming,
    skill: {
      ...current.skill,
      ...incomingSkill
    }
  };
}

function legacySkillInput(input) {
  const skill = {};
  if (Object.hasOwn(input, "effectType")) skill.effectType = input.effectType;
  if (Object.hasOwn(input, "skillName")) skill.name = input.skillName;
  if (Object.hasOwn(input, "skillDescription")) skill.description = input.skillDescription;
  if (Object.hasOwn(input, "uses")) skill.uses = input.uses;
  if (Object.hasOwn(input, "freeTurn")) skill.freeTurn = input.freeTurn;
  if (Object.hasOwn(input, "targetRule")) skill.targetRule = input.targetRule;
  if (Object.hasOwn(input, "paramsJson")) skill.paramsJson = input.paramsJson;
  return skill;
}

function characterRecordToInput(record) {
  return {
    slug: record.slug,
    name: record.name,
    portraitUrl: record.portraitUrl,
    palette: record.palette,
    enabled: record.enabled,
    sortOrder: record.sortOrder,
    skill: {
      effectType: record.skill?.effectType ?? "",
      name: record.skill?.name ?? "",
      description: record.skill?.description ?? "",
      uses: record.skill?.uses ?? 0,
      freeTurn: record.skill?.freeTurn ?? false,
      targetRule: record.skill?.targetRule ?? "",
      paramsJson: record.skill?.paramsJson ?? "{}"
    }
  };
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

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function writeAudit(prisma, adminUser, action, targetId, before, after, targetType = "user") {
  await prisma.adminAuditLog.create({
    data: {
      adminUserId: adminUser.id,
      action,
      targetType,
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
