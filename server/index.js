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
import { prisma, USER_ASSET_RELATION_INCLUDE } from "./db.js";
import { makeAuth, withToken } from "./auth.js";
import { createAdminRouter, safeUploadFilename } from "./adminRoutes.js";
import { createAuthRouter } from "./authRoutes.js";
import { createCommerceRouter } from "./commerceRoutes.js";
import { createAnnouncementRouter } from "./announcementRoutes.js";
import { createOnboardingStoryRouter } from "./onboardingStoryRoutes.js";
import { createGachaRouter } from "./gachaRoutes.js";
import { createMailboxRouter } from "./mailboxRoutes.js";
import { createRecruitmentRouter } from "./recruitmentRoutes.js";
import { createPlayerRouter, createCharacterSelectionData, validateOptionalRoomCode } from "./playerRoutes.js";
import { createPublicRouter } from "./publicRoutes.js";
import { createReplayRouter } from "./replayRoutes.js";
import { createSocialRouter } from "./socialRoutes.js";
import { createLoginSessionStore } from "./loginSessions.js";
import { createDuelRequestManager } from "./duelRequests.js";
import { createOnlineSessionManager } from "./onlineSessions.js";
import { jsonSyntaxErrorHandler } from "./httpErrors.js";
import { installServerLifecycle, startHttpServer } from "./serverLifecycle.js";
import { initializeServerData } from "./serverStartup.js";
import { resolveCharacterUploadDir, resolveUploadRoot } from "./uploadPaths.js";
import { resolveSelectedCharacter } from "./characterSelection.js";
import { installProductionStaticAssets } from "./staticAssets.js";
import { createSocketUserRefresher } from "./socketAuth.js";
import { registerSocketEvents } from "./socketEvents.js";
import { normalizeGameModeId } from "../src/shared/gameModes.js";
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
  broadcastRoomPatch,
  broadcastRoomPresencePatch,
  createDirectRoom,
  detachSocket,
  findRoomForUser,
  flushRoomPersistence,
  getRoom,
  handleGameAction,
  handleScoringAction,
  isUserInActiveRoom,
  joinMatchmaking,
  leaveRoom,
  leaveMatchmaking,
  listActiveRooms,
  listWaitingPlayers,
  listWatchRooms,
  markRoomPreloadReady,
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
  hasBlacklistBetween,
  hasBlacklistFromOwner,
  toSocialUser
} from "./social.js";
import { resumePayloadForUser } from "./resume.js";
import { runtimeStabilityMetrics } from "./runtimeStabilityMetrics.js";

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

await initializeServerData({ prisma });

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
app.use("/api", authHttp, createAnnouncementRouter({ prisma }));
app.use("/api", authHttp, createOnboardingStoryRouter({ prisma }));
app.use("/api", authHttp, createGachaRouter({ prisma }));
app.use("/api", authHttp, createMailboxRouter({ prisma }));
app.use("/api", authHttp, createRecruitmentRouter({ prisma }));

app.use("/api/admin", authHttp, requireAdmin, createAdminRouter({
  prisma,
  uploadMiddleware: upload,
  onlineSessions,
  listActiveRooms,
  matchmakingCount,
  matchmakingCountsByMode,
  runtimeStabilityMetrics
}));
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
  registerOnlineSocket(socket);
  socket.emit("me", socket.user);
  socket.emit("lobby:stats", lobbyStats());
  broadcastLobbyStats();

  registerSocketEvents(socket, {
    io,
    prisma,
    refreshSocketUser,
    listWaitingPlayers,
    hasBlacklistBetween,
    joinMatchmaking,
    leaveMatchmaking,
    broadcastLobbyStats,
    normalizeGameModeId,
    validateRoomCode,
    validateOptionalRoomCode,
    attachSocketToRoom,
    leaveRoom,
    findRoomForUser,
    resumePayloadForUser,
    roomView,
    markRoomPreloadReady,
    metrics: runtimeStabilityMetrics,
    handleGameAction,
    requestCounting,
    respondCounting,
    requestDraw,
    respondDraw,
    handleScoringAction,
    addChat,
    duelRequests,
    unregisterOnlineSocket,
    detachSocket,
    broadcastRoom,
    broadcastRoomPatch,
    broadcastRoomPresencePatch
  });
});

await restorePersistedRooms(io);

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

installProductionStaticAssets(app, { distDir });

installServerLifecycle(server, { beforeShutdown: [flushRoomPersistence], dependencies: [prisma] });
startHttpServer(server, { port: PORT });
