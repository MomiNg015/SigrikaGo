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
import { ensureGameModeSchema, prisma, USER_ASSET_RELATION_INCLUDE } from "./db.js";
import { makeAuth, withToken } from "./auth.js";
import { promoteConfiguredAdmins } from "./adminConfig.js";
import { createAdminRouter, safeUploadFilename } from "./adminRoutes.js";
import { createAuthRouter } from "./authRoutes.js";
import { createCommerceRouter } from "./commerceRoutes.js";
import { createPlayerRouter, createCharacterSelectionData, validateOptionalRoomCode } from "./playerRoutes.js";
import { createPublicRouter } from "./publicRoutes.js";
import { createReplayRouter } from "./replayRoutes.js";
import { createSocialRouter } from "./socialRoutes.js";
import { createLoginSessionStore, ensureLoginSessionSchema } from "./loginSessions.js";
import { createDuelRequestManager } from "./duelRequests.js";
import { createOnlineSessionManager } from "./onlineSessions.js";
import { jsonSyntaxErrorHandler } from "./httpErrors.js";
import { installServerLifecycle, startHttpServer } from "./serverLifecycle.js";
import { resolveCharacterUploadDir, resolveUploadRoot } from "./uploadPaths.js";
import { ensureRoomPersistenceSchema } from "./roomPersistence.js";
import { seedCharacters } from "./characters.js";
import { resolveSelectedCharacter } from "./characterSelection.js";
import { createSocketUserRefresher } from "./socketAuth.js";
import { normalizeGameModeId } from "../src/shared/gameModes.js";
import { seedBuiltinShopItems } from "./shop.js";
import { ensureDefaultSiteSettings } from "./siteSettings.js";
import {
  assertProductionDeployment,
  corsOriginForRequest,
  createApiRateLimit,
  createAuthRateLimit,
  validateRoomCode
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
  ensureSocialSchema,
  hasBlacklistBetween,
  hasBlacklistFromOwner,
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

let onlineSessions;
let duelRequests;

app.use("/api", createPublicRouter({ prisma, authHttp, listWatchRooms }));

app.use("/api", createSocialRouter({ prisma, authHttp, statusForUser }));
const characterSelectionData = createCharacterSelectionData({ prisma });

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

app.use("/api", authHttp, createCommerceRouter({ prisma }));

app.use("/api/admin", authHttp, requireAdmin, createAdminRouter({ prisma, uploadMiddleware: upload }));
app.use("/api", authHttp, createPlayerRouter({
  prisma,
  findRoomForUser,
  roomView,
  characterSelectionData
}));
app.use("/api", authHttp, createReplayRouter({ prisma }));

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
