import crypto from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import { Router } from "express";
import { USER_STATUS } from "./adminConfig.js";
import { validateCharacterInput } from "./characters.js";
import { publicUser, USER_ASSET_RELATION_INCLUDE } from "./db.js";
import { listFeedbackMessages } from "./feedback.js";
import { toShopItemPayload, validateDecorationInput, validateShopItemInput } from "./shop.js";
import { getPublicSiteSettings, updateSiteSettings } from "./siteSettings.js";
import { routeError } from "./adminRouteErrors.js";
import {
  banUser,
  requireUserUpdateData,
  resetUserPassword,
  sanitizeUserUpdate,
  unbanUser,
  updateUserProfile
} from "./adminUserManagement.js";
import {
  assertShopTargetExists,
  createDecoration,
  createShopItem,
  disableDecoration,
  disableShopItem,
  updateDecoration,
  updateShopItem
} from "./adminCatalogManagement.js";
import {
  createCharacter,
  disableCharacter,
  toAdminCharacterPayload,
  updateCharacter
} from "./adminCharacterManagement.js";
import {
  assertGachaPrizeTargetsExist,
  createGachaPool,
  disableGachaPool,
  listAdminGachaPools,
  updateGachaPool,
  validateGachaPoolInput
} from "./adminGachaManagement.js";
import { listMusicTrackSettings, updateMusicTrackSetting } from "./musicTracks.js";

export { serializeAudit } from "./adminAudit.js";
export {
  banUser,
  requireUserUpdateData,
  resetUserPassword,
  sanitizeUserUpdate,
  unbanUser,
  updateUserProfile
} from "./adminUserManagement.js";

const ALLOWED_UPLOAD_TYPES = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"]
]);

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
      take: 200,
      include: USER_ASSET_RELATION_INCLUDE
    });
    res.json({ users: users.map(publicUser) });
  });

  router.get("/users/:id", async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: USER_ASSET_RELATION_INCLUDE
    });
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

  router.get("/music-tracks", async (_req, res) => {
    res.json(await listMusicTrackSettings({ prisma }));
  });

  router.patch("/music-tracks/:id", async (req, res) => {
    try {
      res.json(await updateMusicTrackSetting({
        prisma,
        adminUser: req.user,
        trackId: req.params.id,
        body: req.body
      }));
    } catch (error) {
      sendRouteError(res, error);
    }
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

  router.get("/gacha-pools", async (_req, res) => {
    res.json(await listAdminGachaPools({ prisma }));
  });

  router.post("/gacha-pools", async (req, res) => {
    const validated = validateGachaPoolInput(req.body);
    if (!validated.ok) {
      res.status(400).json({ error: validated.error });
      return;
    }
    try {
      await assertGachaPrizeTargetsExist(prisma, validated.value);
      const pool = await createGachaPool({ prisma, adminUser: req.user, input: validated.value });
      res.json({ pool });
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  router.patch("/gacha-pools/:id", async (req, res) => {
    const validated = validateGachaPoolInput(req.body);
    if (!validated.ok) {
      res.status(400).json({ error: validated.error });
      return;
    }
    try {
      await assertGachaPrizeTargetsExist(prisma, validated.value);
      const pool = await updateGachaPool({
        prisma,
        adminUser: req.user,
        poolId: req.params.id,
        input: validated.value
      });
      res.json({ pool });
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  router.delete("/gacha-pools/:id", async (req, res) => {
    try {
      const pool = await disableGachaPool({ prisma, adminUser: req.user, poolId: req.params.id });
      res.json({ pool });
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
