import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import { Router } from "express";
import { USER_ROLES, USER_STATUS } from "./adminConfig.js";
import { DEFAULT_SKILL_SYSTEM_MESSAGE } from "../src/shared/skillMessages.js";
import { toCharacterPayload, validateCharacterInput } from "./characters.js";
import { publicUser } from "./db.js";
import { listFeedbackMessages } from "./feedback.js";
import { normalizeOwnedItems, serializeOwnedItems } from "./items.js";
import { toShopItemPayload, validateDecorationInput, validateShopItemInput } from "./shop.js";
import { getPublicSiteSettings, updateSiteSettings } from "./siteSettings.js";
import { getStoneDecoration } from "../src/shared/stoneDecorations.js";

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
  if (!extension) return null;
  const stem = String(originalName ?? "")
    .replace(/\.[^.]*$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return `character-${crypto.randomUUID()}-${stem || "portrait"}${extension}`;
}

export function detectImageMimeFromBuffer(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  if (buffer.length >= 8
    && buffer[0] === 0x89
    && buffer[1] === 0x50
    && buffer[2] === 0x4e
    && buffer[3] === 0x47
    && buffer[4] === 0x0d
    && buffer[5] === 0x0a
    && buffer[6] === 0x1a
    && buffer[7] === 0x0a) {
    return "image/png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a") {
    return "image/gif";
  }
  if (buffer.length >= 12
    && buffer.subarray(0, 4).toString("ascii") === "RIFF"
    && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  return null;
}

export async function validatePortraitUpload({ file, readFile: readUploadedFile = readFile }) {
  if (!file?.path) throw routeError(400, "portrait file is required");
  if (!ALLOWED_UPLOAD_TYPES.has(file.mimetype)) throw routeError(400, "Unsupported image type");
  const detectedMime = detectImageMimeFromBuffer(await readUploadedFile(file.path));
  if (!detectedMime) throw routeError(400, "Unsupported image type");
  if (detectedMime !== file.mimetype) throw routeError(400, "Portrait file content does not match image type");
  return file;
}

async function removeUploadedFile(file) {
  if (!file?.path) return;
  try {
    await unlink(file.path);
  } catch {
    // The file may already have been removed by the platform or test harness.
  }
}

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
      const ownedCharacters = value
        .filter((character) => typeof character === "string")
        .map((character) => character.trim())
        .filter(Boolean)
        .join(",");
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

  router.get("/audit-logs", async (_req, res) => {
    const auditLogs = await prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100
    });
    res.json({ auditLogs });
  });

  router.get("/feedback", async (_req, res) => {
    res.json(await listFeedbackMessages({ prisma }));
  });

  router.get("/site-settings", async (_req, res) => {
    res.json({ settings: await getPublicSiteSettings(prisma) });
  });

  router.patch("/site-settings", async (req, res) => {
    try {
      res.json(await updateSiteSettings({ prisma, adminUser: req.user, body: req.body }));
    } catch (error) {
      sendRouteError(res, error);
    }
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

  router.get("/users/:id/replays", async (req, res) => {
    const records = await prisma.gameRecord.findMany({
      where: {
        OR: [
          { blackUserId: req.params.id },
          { whiteUserId: req.params.id }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    res.json({
      records: records.map((record) => ({
        id: record.id,
        roomCode: record.roomCode,
        blackName: record.blackName,
        whiteName: record.whiteName,
        resultText: record.resultText,
        winnerColor: record.winnerColor,
        resultReason: record.resultReason,
        moveCount: record.moveCount,
        createdAt: record.createdAt
      }))
    });
  });

  router.get("/replays/:id", async (req, res) => {
    const record = await prisma.gameRecord.findUnique({ where: { id: req.params.id } });
    if (!record) {
      res.status(404).json({ error: "棋谱不存在" });
      return;
    }
    res.json({ record: { ...record, snapshot: JSON.parse(record.snapshot) } });
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
    res.json({ characters: characters.map(toAdminCharacterPayload) });
  });

  router.get("/decorations", async (_req, res) => {
    const decorations = await prisma.decoration.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });
    res.json({ decorations });
  });

  router.post("/decorations", async (req, res) => {
    const validated = validateDecorationInput(req.body);
    if (!validated.ok) {
      res.status(400).json({ error: validated.error });
      return;
    }
    try {
      const decoration = await createDecoration({ prisma, adminUser: req.user, input: validated.value });
      res.json({ decoration });
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  router.patch("/decorations/:id", async (req, res) => {
    const validated = validateDecorationInput(req.body);
    if (!validated.ok) {
      res.status(400).json({ error: validated.error });
      return;
    }
    try {
      const decoration = await updateDecoration({
        prisma,
        adminUser: req.user,
        decorationId: req.params.id,
        input: validated.value
      });
      res.json({ decoration });
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  router.delete("/decorations/:id", async (req, res) => {
    try {
      const decoration = await disableDecoration({
        prisma,
        adminUser: req.user,
        decorationId: req.params.id
      });
      res.json({ decoration });
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  router.get("/shop-items", async (_req, res) => {
    const items = await prisma.shopItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });
    res.json({ items: items.map(toShopItemPayload) });
  });

  router.post("/shop-items", async (req, res) => {
    const validated = validateShopItemInput(req.body);
    if (!validated.ok) {
      res.status(400).json({ error: validated.error });
      return;
    }
    try {
      await assertShopTargetExists(prisma, validated.value);
      const item = await createShopItem({ prisma, adminUser: req.user, input: validated.value });
      res.json({ item: toShopItemPayload(item) });
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  router.patch("/shop-items/:id", async (req, res) => {
    const validated = validateShopItemInput(req.body);
    if (!validated.ok) {
      res.status(400).json({ error: validated.error });
      return;
    }
    try {
      await assertShopTargetExists(prisma, validated.value);
      const item = await updateShopItem({
        prisma,
        adminUser: req.user,
        itemId: req.params.id,
        input: validated.value
      });
      res.json({ item: toShopItemPayload(item) });
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  router.delete("/shop-items/:id", async (req, res) => {
    try {
      const item = await disableShopItem({ prisma, adminUser: req.user, itemId: req.params.id });
      res.json({ item: toShopItemPayload(item) });
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  router.post("/characters", async (req, res) => {
    const validated = validateCharacterInput(req.body);
    if (!validated.ok) {
      res.status(400).json({ error: validated.error });
      return;
    }
    try {
      const character = await createCharacter({ prisma, adminUser: req.user, input: validated.value });
      res.json({ character: toAdminCharacterPayload(character) });
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
      res.json({ character: toAdminCharacterPayload(character) });
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
      res.json({ character: toAdminCharacterPayload(character) });
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  if (uploadMiddleware) {
    router.post(
      "/uploads/character-portrait",
      (req, res, next) => {
        uploadMiddleware.single("portrait")(req, res, (error) => {
          if (error) {
            sendUploadError(res, error);
            return;
          }
          next();
        });
      },
      async (req, res) => {
        try {
          if (!req.file) {
            res.status(400).json({ error: "portrait file is required" });
            return;
          }
          await validatePortraitUpload({ file: req.file });
          res.json({ url: `/uploads/characters/${req.file.filename}` });
        } catch (error) {
          await removeUploadedFile(req.file);
          sendUploadError(res, error);
        }
      }
    );
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

async function createDecoration({ prisma, adminUser, input }) {
  return prisma.$transaction(async (tx) => {
    const decoration = await tx.decoration.create({ data: input });
    await writeAudit(tx, adminUser, "decoration.create", decoration.slug, null, decoration, "decoration");
    return decoration;
  });
}

async function updateDecoration({ prisma, adminUser, decorationId, input }) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.decoration.findUnique({ where: { id: decorationId } });
    if (!before) throw routeError(404, "Decoration not found");
    const after = await tx.decoration.update({ where: { id: decorationId }, data: input });
    await writeAudit(tx, adminUser, "decoration.update", after.slug, before, after, "decoration");
    return after;
  });
}

async function disableDecoration({ prisma, adminUser, decorationId }) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.decoration.findUnique({ where: { id: decorationId } });
    if (!before) throw routeError(404, "Decoration not found");
    const after = await tx.decoration.update({ where: { id: decorationId }, data: { enabled: false } });
    await writeAudit(tx, adminUser, "decoration.disable", after.slug, before, after, "decoration");
    return after;
  });
}

async function createShopItem({ prisma, adminUser, input }) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.shopItem.create({ data: input });
    await writeAudit(tx, adminUser, "shop-item.create", item.id, null, toShopItemPayload(item), "shop-item");
    return item;
  });
}

async function updateShopItem({ prisma, adminUser, itemId, input }) {
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

async function disableShopItem({ prisma, adminUser, itemId }) {
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

function characterCreateData(input) {
  return {
    slug: input.slug,
    name: input.name,
    portraitUrl: input.portraitUrl,
    portraitSource: input.portraitSource,
    acquisitionMethod: input.acquisitionMethod,
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
    portraitSource: input.portraitSource,
    acquisitionMethod: input.acquisitionMethod,
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
    costType: skill.costType,
    costValue: skill.costValue,
    systemMessage: skill.systemMessage,
    enabled: skill.enabled
  };
}

function toAdminCharacterPayload(record) {
  const payload = toCharacterPayload(record);
  const skill = record.skill
    ? {
        id: record.skill.id,
        effectType: record.skill.effectType,
        name: record.skill.name,
        uses: record.skill.uses,
        description: record.skill.description,
        freeTurn: record.skill.freeTurn,
        targetRule: record.skill.targetRule,
        params: {},
        costType: record.skill.costType ?? "numeric",
        costValue: record.skill.costValue ?? String(record.skill.cost ?? 0),
        cost: 0,
        systemMessage: record.skill.systemMessage ?? DEFAULT_SKILL_SYSTEM_MESSAGE,
        enabled: record.skill.enabled ?? true,
        paramsJson: record.skill.paramsJson ?? "{}"
      }
    : null;
  return {
    ...payload,
    sortOrder: record.sortOrder,
    skill
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
  if (Object.hasOwn(input, "costType")) skill.costType = input.costType;
  if (Object.hasOwn(input, "costValue")) skill.costValue = input.costValue;
  if (Object.hasOwn(input, "systemMessage")) skill.systemMessage = input.systemMessage;
  if (Object.hasOwn(input, "skillEnabled")) skill.enabled = input.skillEnabled;
  return skill;
}

function characterRecordToInput(record) {
  return {
    slug: record.slug,
    name: record.name,
    portraitUrl: record.portraitUrl,
    portraitSource: record.portraitSource,
    acquisitionMethod: record.acquisitionMethod ?? "",
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
      paramsJson: record.skill?.paramsJson ?? "{}",
      costType: record.skill?.costType ?? "numeric",
      costValue: record.skill?.costValue ?? "0",
      systemMessage: record.skill?.systemMessage ?? DEFAULT_SKILL_SYSTEM_MESSAGE,
      enabled: record.skill?.enabled ?? true
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

async function assertShopTargetExists(prisma, item) {
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
  }
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

function sendUploadError(res, error) {
  if (error.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({ error: "Portrait file must be 3MB or smaller" });
    return;
  }
  if (error.status) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  throw error;
}
