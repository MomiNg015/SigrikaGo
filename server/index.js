import "dotenv/config";
import cors from "cors";
import express from "express";
import fs from "node:fs";
import helmet from "helmet";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { Server } from "socket.io";
import { ensureGameModeSchema, prisma, USER_ASSET_RELATION_INCLUDE, USER_ASSET_RELATION_SELECT } from "./db.js";
import { makeAuth, withToken } from "./auth.js";
import { promoteConfiguredAdmins } from "./adminConfig.js";
import { createAdminRouter, safeUploadFilename } from "./adminRoutes.js";
import { createAuthRouter } from "./authRoutes.js";
import { createPlayerRouter, createCharacterSelectionData, validateOptionalRoomCode } from "./playerRoutes.js";
import { createReplayRouter } from "./replayRoutes.js";
import { createLoginSessionStore, ensureLoginSessionSchema } from "./loginSessions.js";
import { createDuelRequestManager } from "./duelRequests.js";
import { createOnlineSessionManager } from "./onlineSessions.js";
import { jsonSyntaxErrorHandler } from "./httpErrors.js";
import { installServerLifecycle, startHttpServer } from "./serverLifecycle.js";
import { resolveCharacterUploadDir, resolveUploadRoot } from "./uploadPaths.js";
import { ensureRoomPersistenceSchema } from "./roomPersistence.js";
import { listPublicCharacterResponse, seedCharacters } from "./characters.js";
import { resolveSelectedCharacter } from "./characterSelection.js";
import { createSocketUserRefresher } from "./socketAuth.js";
import { createFeedbackMessage } from "./feedback.js";
import { buildLeaderboard } from "./leaderboard.js";
import { normalizeGameModeId } from "../src/shared/gameModes.js";
import { listShopItems, purchaseShopItem, seedBuiltinShopItems } from "./shop.js";
import { listItemInventory, useInventoryItem } from "./items.js";
import { ensureDefaultSiteSettings, getPublicSiteSettings } from "./siteSettings.js";
import {
  assertProductionDeployment,
  corsOriginForRequest,
  createApiRateLimit,
  createAuthRateLimit,
  validateRoomCode,
  validateUsername
} from "./security.js";
import {
  addChat,
  attachSocketToRoom,
  broadcastRoom,
  createDirectRoom,
  detachSocket,
  findRoomForUser,
  getRoom,
  handleGameAction,
  handleScoringAction,
  isUserInActiveRoom,
  joinMatchmaking,
  leaveRoom,
  leaveMatchmaking,
  listWaitingPlayers,
  listWatchRooms,
  matchmakingCountsByMode,
  matchmakingCount,
  requestCounting,
  requestDraw,
  restorePersistedRooms,
  respondCounting,
  respondDraw,
  roomView
} from "./rooms.js";
import {
  deleteRelationship,
  ensureSocialSchema,
  getUserProfile,
  getUserProfileByUsername,
  getUserReplays,
  hasBlacklistBetween,
  hasBlacklistFromOwner,
  listSocialUsers,
  RELATIONSHIP_TYPES,
  setRelationship,
  toSocialUser
} from "./social.js";
import { resumePayloadForUser } from "./resume.js";

const app = express();
const server = createServer(app);
const PORT = Number(process.env.PORT ?? 3001);
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
assertProductionDeployment();
const loginSessions = createLoginSessionStore({ prisma });
const { authHttp, requireAdmin } = makeAuth({
  prisma,
  jwtSecret: JWT_SECRET,
  isSessionActive: (userId, sessionId) => loginSessions.adopt(userId, sessionId)
});
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const uploadRoot = resolveUploadRoot({ projectRoot });
const uploadDir = resolveCharacterUploadDir({ projectRoot });
const distDir = path.join(__dirname, "..", "dist");
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  limits: { fileSize: 3 * 1024 * 1024 },
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const filename = safeUploadFilename(file.originalname, file.mimetype);
      if (!filename) {
        cb(Object.assign(new Error("Unsupported image type"), { status: 400 }));
        return;
      }
      cb(null, filename);
    }
  })
});

const corsOptions = {
  origin: (origin, callback) => corsOriginForRequest(origin, callback),
  credentials: true
};

app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      mediaSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:", "ws:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: "64kb" }));
app.use(jsonSyntaxErrorHandler);
app.use("/api/auth", createAuthRateLimit());
app.use("/api", createApiRateLimit());
app.use("/uploads", express.static(uploadRoot));

const io = new Server(server, {
  cors: corsOptions
});

await seedCharacters(prisma);
await seedBuiltinShopItems(prisma);
await ensureDefaultSiteSettings(prisma);
await ensureSocialSchema(prisma);
await ensureRoomPersistenceSchema(prisma);
await ensureLoginSessionSchema(prisma);
await ensureGameModeSchema(prisma);
await promoteConfiguredAdmins(prisma);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/characters", async (_req, res) => {
  res.json(await listPublicCharacterResponse(prisma));
});

app.get("/api/shop", authHttp, async (req, res) => {
  res.json(await listShopItems(prisma, req.user.id));
});
let onlineSessions;
let duelRequests;

app.get("/api/site-settings", async (_req, res) => {
  res.json({ settings: await getPublicSiteSettings(prisma) });
});

app.post("/api/feedback", authHttp, async (req, res) => {
  try {
    res.json(await createFeedbackMessage({
      prisma,
      user: req.user,
      content: req.body.content
    }));
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message ?? "反馈提交失败" });
  }
});

app.get("/api/leaderboard", authHttp, async (req, res) => {
  const mode = normalizeGameModeId(req.query.mode);
  const [users, records] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        rating: true,
        selectedCharacter: true,
        itemEffects: true,
        ...USER_ASSET_RELATION_SELECT
      }
    }),
    prisma.gameRecord.findMany({
      where: { mode },
      select: {
        blackUserId: true,
        whiteUserId: true,
        blackCharacter: true,
        whiteCharacter: true,
        winnerColor: true,
        resultReason: true,
        resultText: true,
        mode: true
      }
    })
  ]);
  res.json({ players: buildLeaderboard(users, records, { mode }) });
});

app.get("/api/rooms/watch", authHttp, async (req, res) => {
  const mode = normalizeGameModeId(req.query.mode);
  res.json({ rooms: listWatchRooms().filter((room) => normalizeGameModeId(room.mode) === mode) });
});

app.get("/api/social", authHttp, async (req, res) => {
  res.json(await listSocialUsers({
    prisma,
    userId: req.user.id,
    statusForUser
  }));
});

app.post("/api/social/friends/:targetId", authHttp, async (req, res) => {
  try {
    await setRelationship({
      prisma,
      ownerUserId: req.user.id,
      targetUserId: req.params.targetId,
      type: RELATIONSHIP_TYPES.friend
    });
    res.json(await listSocialUsers({ prisma, userId: req.user.id, statusForUser }));
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message ?? "操作失败" });
  }
});

app.delete("/api/social/friends/:targetId", authHttp, async (req, res) => {
  await deleteRelationship({
    prisma,
    ownerUserId: req.user.id,
    targetUserId: req.params.targetId,
    type: RELATIONSHIP_TYPES.friend
  });
  res.json(await listSocialUsers({ prisma, userId: req.user.id, statusForUser }));
});

app.post("/api/social/blacklist/:targetId", authHttp, async (req, res) => {
  try {
    await setRelationship({
      prisma,
      ownerUserId: req.user.id,
      targetUserId: req.params.targetId,
      type: RELATIONSHIP_TYPES.blacklist
    });
    res.json(await listSocialUsers({ prisma, userId: req.user.id, statusForUser }));
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message ?? "操作失败" });
  }
});

app.delete("/api/social/blacklist/:targetId", authHttp, async (req, res) => {
  await deleteRelationship({
    prisma,
    ownerUserId: req.user.id,
    targetUserId: req.params.targetId,
    type: RELATIONSHIP_TYPES.blacklist
  });
  res.json(await listSocialUsers({ prisma, userId: req.user.id, statusForUser }));
});

app.get("/api/users/search/profile", authHttp, async (req, res) => {
  const usernameResult = validateUsername(req.query.username);
  if (!usernameResult.ok) {
    res.status(400).json({ error: usernameResult.error });
    return;
  }
  const profile = await getUserProfileByUsername({
    prisma,
    username: usernameResult.value,
    viewerId: req.user.id,
    statusForUser,
    mode: normalizeGameModeId(req.query.mode)
  });
  if (!profile) {
    res.status(404).json({ error: "\u8be5\u7528\u6237\u4e0d\u5b58\u5728" });
    return;
  }
  res.json({ profile });
});

app.get("/api/users/:id/profile", authHttp, async (req, res) => {
  const profile = await getUserProfile({
    prisma,
    userId: req.params.id,
    viewerId: req.user.id,
    statusForUser,
    mode: normalizeGameModeId(req.query.mode)
  });
  if (!profile) {
    res.status(404).json({ error: "\u7528\u6237\u4e0d\u5b58\u5728" });
    return;
  }
  res.json({ profile });
});

app.get("/api/users/:id/replays", async (req, res) => {
  const records = await getUserReplays({
    prisma,
    userId: req.params.id,
    mode: normalizeGameModeId(req.query.mode)
  });
  if (!records) {
    res.status(404).json({ error: "\u7528\u6237\u4e0d\u5b58\u5728" });
    return;
  }
  res.json({ records });
});

app.post("/api/shop/:id/purchase", authHttp, async (req, res) => {
  try {
    res.json(await purchaseShopItem({ prisma, userId: req.user.id, itemId: req.params.id }));
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message ?? "购买失败" });
  }
});

app.get("/api/items/inventory", authHttp, async (req, res) => {
  try {
    res.json(await listItemInventory({ prisma, userId: req.user.id }));
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message ?? "\u8bfb\u53d6\u4ed3\u5e93\u5931\u8d25" });
  }
});

app.post("/api/items/:itemId/use", authHttp, async (req, res) => {
  try {
    res.json(await useInventoryItem({
      prisma,
      userId: req.user.id,
      itemId: req.params.itemId,
      characterId: req.body.characterId
    }));
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message ?? "使用道具失败" });
  }
});

app.use("/api/admin", authHttp, requireAdmin, createAdminRouter({ prisma, uploadMiddleware: upload }));
const characterSelectionData = createCharacterSelectionData({ prisma });
app.use("/api", authHttp, createPlayerRouter({
  prisma,
  findRoomForUser,
  roomView,
  characterSelectionData
}));
app.use("/api", authHttp, createReplayRouter({ prisma }));

const refreshSocketUser = createSocketUserRefresher({
  jwtSecret: JWT_SECRET,
  prisma,
  characterSelectionData,
  isSessionActive: (userId, sessionId) => loginSessions.adopt(userId, sessionId)
});

onlineSessions = createOnlineSessionManager({
  io,
  sessions: loginSessions,
  signLoginResponse: (user, session) => withToken(user, JWT_SECRET, { sessionId: session.sessionId }),
  isUserInActiveRoom,
  onSocketDisconnected: (socket) => {
    duelRequests?.expireSocketRequests(socket.id);
  }
});
duelRequests = createDuelRequestManager({
  io,
  isUserInActiveRoom,
  firstOnlineSocket,
  statusForUser,
  toSocialUser,
  createDirectRoom,
  refreshSocketUser,
  isDuelBlocked: (requesterId, targetId) => hasBlacklistFromOwner({
    prisma,
    ownerUserId: targetId,
    targetUserId: requesterId
  })
});

app.use("/api/auth", createAuthRouter({
  prisma,
  jwtSecret: JWT_SECRET,
  loginSessions,
  onlineSessions
}));

function lobbyStats() {
  const matchmakingCounts = matchmakingCountsByMode();
  return {
    onlineCount: onlineSessions?.onlineCount?.() ?? 0,
    matchmakingCount: matchmakingCount(),
    matchmakingCounts
  };
}

function broadcastLobbyStats() {
  io.emit("lobby:stats", lobbyStats());
}

io.use(async (socket, next) => {
  try {
    await refreshSocketUser(socket);
    next();
  } catch (error) {
    next(new Error(error.message === "forbidden" ? "forbidden" : "unauthorized"));
  }
});

io.on("connection", (socket) => {
  installSocketRateGuard(socket);
  registerOnlineSocket(socket);
  socket.emit("me", socket.user);
  socket.emit("lobby:stats", lobbyStats());
  broadcastLobbyStats();

  socket.on("match:join", async ({ mode: modeInput } = {}) => {
    try {
      const mode = normalizeGameModeId(modeInput);
      await refreshSocketUser(socket);
      const blockedCandidateIds = new Set();
      for (const candidate of listWaitingPlayers()) {
        if (await hasBlacklistBetween({
          prisma,
          firstUserId: socket.user.id,
          secondUserId: candidate.user.id
        })) {
          blockedCandidateIds.add(candidate.user.id);
        }
      }
      const room = joinMatchmaking(
        { user: socket.user, socketId: socket.id, mode },
        io,
        { canPair: (candidate) => !blockedCandidateIds.has(candidate.user.id) }
      );
      if (!room) socket.emit("match:waiting", { startedAt: Date.now(), mode });
      broadcastLobbyStats();
    } catch (error) {
      socket.emit("error:toast", "登录状态已失效，请重新登录");
    }
  });

  socket.on("match:leave", () => {
    leaveMatchmaking(socket.user.id);
    socket.emit("match:left");
    broadcastLobbyStats();
  });

  socket.on("room:join", ({ roomCode } = {}) => {
    const validatedRoomCode = validateRoomCode(roomCode);
    if (!validatedRoomCode.ok) {
      socket.emit("error:toast", validatedRoomCode.error);
      return;
    }
    const room = attachSocketToRoom(validatedRoomCode.value, socket, socket.user);
    if (!room) {
      socket.emit("error:toast", "房间不存在或已经关闭");
      return;
    }
    socket.emit("room:update", roomView(room, socket.user.id));
    broadcastRoom(io, room);
  });

  socket.on("room:leave", ({ roomCode } = {}) => {
    const room = leaveRoom(roomCode, socket.user.id, socket.id);
    if (!room) return;
    socket.leave(room.code);
    socket.emit("room:left", { roomCode: room.code });
    broadcastRoom(io, room);
  });

  socket.on("room:resume", async ({ roomCode } = {}) => {
    const payload = await resumePayloadForUser({
      prisma,
      userId: socket.user.id,
      roomCode: validateOptionalRoomCode(roomCode),
      findRoomForUser,
      roomView
    });
    if (payload.type === "room") {
      const room = attachSocketToRoom(payload.room.code, socket, socket.user);
      if (room) {
        socket.emit("room:update", roomView(room, socket.user.id));
        broadcastRoom(io, room);
        return;
      }
    }
    socket.emit("room:resume", payload);
  });

  socket.on("game:action", (payload = {}) => {
    const result = handleGameAction(payload.roomCode, socket.user.id, payload.action, io);
    sendResult(socket, result);
    if (result.ok) broadcastRoom(io, result.room);
  });

  socket.on("counting:request", ({ roomCode } = {}) => {
    const result = requestCounting(roomCode, socket.user.id, io);
    sendResult(socket, result);
    if (result.ok) broadcastRoom(io, result.room);
  });

  socket.on("counting:respond", ({ roomCode, accepted } = {}) => {
    const result = respondCounting(roomCode, socket.user.id, accepted);
    sendResult(socket, result);
    if (result.ok) broadcastRoom(io, result.room);
  });

  socket.on("draw:request", ({ roomCode } = {}) => {
    const result = requestDraw(roomCode, socket.user.id, io);
    sendResult(socket, result);
    if (result.ok) broadcastRoom(io, result.room);
  });

  socket.on("draw:respond", ({ roomCode, accepted } = {}) => {
    const result = respondDraw(roomCode, socket.user.id, accepted, io);
    sendResult(socket, result);
    if (result.ok) broadcastRoom(io, result.room);
  });

  socket.on("scoring:action", (payload = {}) => {
    const result = handleScoringAction(payload.roomCode, socket.user.id, payload.action, io);
    sendResult(socket, result);
    if (result.ok) broadcastRoom(io, result.room);
  });

  socket.on("chat:send", ({ roomCode, text } = {}) => {
    const room = addChat(roomCode, socket.user, text);
    if (room) broadcastRoom(io, room);
  });

  socket.on("duel:request", async ({ targetUserId, mode: modeInput } = {}) => {
    try {
      await refreshSocketUser(socket);
      await duelRequests.handleRequest(socket, String(targetUserId ?? ""), normalizeGameModeId(modeInput));
    } catch (error) {
      socket.emit("error:toast", "登录状态已失效，请重新登录");
    }
  });

  socket.on("duel:respond", async ({ requestId, accepted } = {}) => {
    try {
      await refreshSocketUser(socket);
      await duelRequests.handleResponse(socket, String(requestId ?? ""), Boolean(accepted));
      broadcastLobbyStats();
    } catch (error) {
      socket.emit("error:toast", "登录状态已失效，请重新登录");
    }
  });

  socket.on("disconnect", () => {
    unregisterOnlineSocket(socket);
    for (const room of detachSocket(socket.id, io)) {
      broadcastRoom(io, room);
    }
    broadcastLobbyStats();
  });
});

await restorePersistedRooms(io);

function sendResult(socket, result) {
  if (!result.ok) socket.emit("error:toast", result.error);
}

function validateOptionalRoomCode(roomCode) {
  if (!roomCode) return "";
  const result = validateRoomCode(String(roomCode));
  return result.ok ? result.value : "";
}

function installSocketRateGuard(socket) {
  socket.data.rateGuard = { startedAt: Date.now(), count: 0 };
  socket.use((_packet, next) => {
    const guard = socket.data.rateGuard;
    const now = Date.now();
    if (now - guard.startedAt > 10000) {
      guard.startedAt = now;
      guard.count = 0;
    }
    guard.count += 1;
    if (guard.count > 120) {
      socket.emit("error:toast", "鎿嶄綔杩囦簬棰戠箒锛岃绋嶅悗鍐嶈瘯");
      return;
    }
    next();
  });
}

function registerOnlineSocket(socket) {
  onlineSessions.registerOnlineSocket(socket);
}

function unregisterOnlineSocket(socket) {
  onlineSessions.unregisterOnlineSocket(socket);
}

function statusForUser(userId) {
  return onlineSessions.statusForUser(userId);
}

function firstOnlineSocket(userId) {
  return onlineSessions.firstOnlineSocket(userId);
}

function isUserOnline(userId) {
  return onlineSessions?.hasOnlineUser?.(userId) ?? false;
}

if (process.env.NODE_ENV === "production" && fs.existsSync(distDir)) {
  app.use(express.static(distDir, {
    maxAge: "1h",
    setHeaders: (res, filePath) => {
      if (/\.[a-f0-9]{8,}\./i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    }
  }));
  app.get(/^(?!\/api|\/socket\.io|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

installServerLifecycle(server, { dependencies: [prisma] });
startHttpServer(server, { port: PORT });
