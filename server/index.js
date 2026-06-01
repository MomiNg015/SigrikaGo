import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import fs from "node:fs";
import helmet from "helmet";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { Server } from "socket.io";
import { prisma, publicUser } from "./db.js";
import { makeAuth, withToken } from "./auth.js";
import { promoteConfiguredAdmins, syncConfiguredAdmin, USER_STATUS } from "./adminConfig.js";
import { createAdminRouter, safeUploadFilename } from "./adminRoutes.js";
import {
  ALREADY_LOGGED_IN_CODE,
  ALREADY_LOGGED_IN_MESSAGE,
  buildClearRefreshCookie,
  buildRefreshCookie,
  createLoginSessionStore,
  ensureLoginSessionSchema,
  parseCookies,
  REFRESH_COOKIE_NAME
} from "./loginSessions.js";
import { createDuelRequestManager } from "./duelRequests.js";
import { createOnlineSessionManager } from "./onlineSessions.js";
import { jsonSyntaxErrorHandler } from "./httpErrors.js";
import { shouldBlockLoginForActiveAccount } from "./loginConflicts.js";
import { installServerLifecycle, startHttpServer } from "./serverLifecycle.js";
import { resolveCharacterUploadDir, resolveUploadRoot } from "./uploadPaths.js";
import { ensureRoomPersistenceSchema } from "./roomPersistence.js";
import { listPublicCharacterResponse, listPublicCharacters, seedCharacters } from "./characters.js";
import { CHARACTERS } from "../src/shared/characters.js";
import { resolveSelectedCharacter } from "./characterSelection.js";
import { createSocketUserRefresher } from "./socketAuth.js";
import { createFeedbackMessage } from "./feedback.js";
import { buildLeaderboard } from "./leaderboard.js";
import { publicUserWithRecordStats } from "./userProfile.js";
import { listShopItems, purchaseShopItem, seedBuiltinShopItems } from "./shop.js";
import { listItemInventory, useInventoryItem } from "./items.js";
import { getPublicSiteSettings } from "./siteSettings.js";
import { getStoneDecoration } from "../src/shared/stoneDecorations.js";
import { blockedCharactersForItemEffects } from "./itemEffects.js";
import {
  assertProductionDeployment,
  corsOriginForRequest,
  createApiRateLimit,
  createAuthRateLimit,
  validatePassword,
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
  matchmakingCount,
  requestCounting,
  requestDraw,
  restorePersistedRooms,
  respondCounting,
  respondDraw,
  roomView
} from "./rooms.js";
import { resumePayloadForUser } from "./resume.js";
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
await ensureSocialSchema(prisma);
await ensureRoomPersistenceSchema(prisma);
await ensureLoginSessionSchema(prisma);
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
    res.status(error.status ?? 500).json({ error: error.message ?? "鍙嶉鎻愪氦澶辫触" });
  }
});

app.get("/api/leaderboard", authHttp, async (_req, res) => {
  const [users, records] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        rating: true,
        selectedCharacter: true,
        itemEffects: true
      }
    }),
    prisma.gameRecord.findMany({
      select: {
        blackUserId: true,
        whiteUserId: true,
        blackCharacter: true,
        whiteCharacter: true,
        winnerColor: true,
        resultReason: true,
        resultText: true
      }
    })
  ]);
  res.json({ players: buildLeaderboard(users, records) });
});

app.get("/api/rooms/watch", authHttp, async (_req, res) => {
  res.json({ rooms: listWatchRooms() });
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
    res.status(error.status ?? 500).json({ error: error.message ?? "鎿嶄綔澶辫触" });
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
    res.status(error.status ?? 500).json({ error: error.message ?? "鎿嶄綔澶辫触" });
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
    statusForUser
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
    statusForUser
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
    userId: req.params.id
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
    res.status(error.status ?? 500).json({ error: error.message ?? "璐拱澶辫触" });
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
    res.status(error.status ?? 500).json({ error: error.message ?? "浣跨敤閬撳叿澶辫触" });
  }
});

app.use("/api/admin", authHttp, requireAdmin, createAdminRouter({ prisma, uploadMiddleware: upload }));

app.post("/api/auth/register", async (req, res) => {
  const usernameResult = validateUsername(req.body.username);
  const passwordResult = validatePassword(req.body.password);
  if (!usernameResult.ok) {
    res.status(400).json({ error: usernameResult.error });
    return;
  }
  if (!passwordResult.ok) {
    res.status(400).json({ error: passwordResult.error });
    return;
  }
  const username = usernameResult.value;
  const password = passwordResult.value;
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({ data: { username, passwordHash } });
    const syncedUser = await syncConfiguredAdmin(user, prisma);
    await sendLoginResponse(res, syncedUser);
  } catch {
    res.status(409).json({ error: "\u7528\u6237\u540d\u5df2\u5b58\u5728" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const usernameResult = validateUsername(req.body.username);
  const passwordResult = validatePassword(req.body.password);
  if (!usernameResult.ok || !passwordResult.ok) {
    res.status(401).json({ error: "\u7528\u6237\u540d\u6216\u5bc6\u7801\u9519\u8bef" });
    return;
  }
  const username = usernameResult.value;
  const password = passwordResult.value;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "\u7528\u6237\u540d\u6216\u5bc6\u7801\u9519\u8bef" });
    return;
  }
  if (user.status === USER_STATUS.banned) {
    res.status(403).json({ error: user.banReason ? `\u8d26\u53f7\u5df2\u5c01\u7981\uff1a${user.banReason}` : "\u8d26\u53f7\u5df2\u5c01\u7981" });
    return;
  }
  if (shouldBlockLoginForActiveAccount({
    onlineSessions,
    userId: user.id,
    forceLogin: Boolean(req.body.forceLogin)
  })) {
    res.status(409).json({
      code: ALREADY_LOGGED_IN_CODE,
      error: ALREADY_LOGGED_IN_MESSAGE
    });
    return;
  }
  if (req.body.forceLogin) await forceLogoutUser(user.id);
  const syncedUser = await syncConfiguredAdmin(user, prisma);
  await sendLoginResponse(res, syncedUser);
});

app.post("/api/auth/refresh", async (req, res) => {
  const refreshToken = parseCookies(req.headers.cookie)[REFRESH_COOKIE_NAME];
  const session = await loginSessions.refresh(refreshToken);
  if (!session) {
    res.setHeader("Set-Cookie", buildClearRefreshCookie());
    res.status(401).json({ error: "\u8bf7\u5148\u767b\u5f55" });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.status === USER_STATUS.banned) {
    await loginSessions.clear(session.userId, session.sessionId);
    res.setHeader("Set-Cookie", buildClearRefreshCookie());
    res.status(user?.status === USER_STATUS.banned ? 403 : 401).json({
      error: user?.banReason ? `\u8d26\u53f7\u5df2\u5c01\u7981\uff1a${user.banReason}` : "\u8bf7\u5148\u767b\u5f55"
    });
    return;
  }
  res.setHeader("Set-Cookie", buildRefreshCookie(session.refreshToken));
  res.json(withToken(await syncConfiguredAdmin(user, prisma), JWT_SECRET, { sessionId: session.sessionId }));
});

app.post("/api/auth/logout", async (req, res) => {
  const refreshToken = parseCookies(req.headers.cookie)[REFRESH_COOKIE_NAME];
  await loginSessions.clearRefreshToken(refreshToken);
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const payload = token ? JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) : null;
    if (payload?.sub && payload?.sid) await loginSessions.clear(payload.sub, payload.sid);
  } catch {
    // Logout should succeed even if the access token is malformed or expired.
  }
  res.setHeader("Set-Cookie", buildClearRefreshCookie());
  res.json({ ok: true });
});

app.get("/api/me", authHttp, async (req, res) => {
  res.json({ user: await publicUserWithHistory(req.user) });
});

app.get("/api/me/resume", authHttp, async (req, res) => {
  res.json(await resumePayloadForUser({
    prisma,
    userId: req.user.id,
    roomCode: validateOptionalRoomCode(req.query.roomCode),
    findRoomForUser,
    roomView
  }));
});

app.post("/api/me/character", authHttp, async (req, res) => {
  const characterId = String(req.body.characterId ?? "");
  const publicProfile = publicUser(req.user);
  if (blockedCharactersForItemEffects(publicProfile.itemEffects).has(characterId)) {
    res.status(403).json({ error: "\u7cd6\u679c\u6548\u679c\u4e2d\uff0c\u6682\u65f6\u65e0\u6cd5\u51fa\u6218" });
    return;
  }
  if (!publicProfile.ownedCharacters.includes(characterId)) {
    res.status(403).json({ error: "\u5c1a\u672a\u83b7\u5f97\u8be5\u89d2\u8272" });
    return;
  }
  const { characters, disabledSlugs } = await characterSelectionData();
  if (!characters[characterId] && (disabledSlugs.has(characterId) || !CHARACTERS[characterId])) {
    res.status(400).json({ error: "\u89d2\u8272\u4e0d\u5b58\u5728" });
    return;
  }
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { selectedCharacter: characterId }
  });
  res.json({ user: publicUser(user) });
});

app.post("/api/me/decoration", authHttp, async (req, res) => {
  const decorationId = String(req.body.decorationId ?? "").trim();
  if (decorationId) {
    if (!getStoneDecoration(decorationId)) {
      res.status(400).json({ error: "\u88c5\u9970\u4e0d\u5b58\u5728" });
      return;
    }
    const ownedDecorations = publicUser(req.user).ownedDecorations;
    if (!ownedDecorations.includes(decorationId)) {
      res.status(403).json({ error: "\u5c1a\u672a\u83b7\u5f97\u8be5\u88c5\u9970" });
      return;
    }
  }
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { selectedStoneDecoration: decorationId }
  });
  res.json({ user: publicUser(user) });
});

app.get("/api/replays", authHttp, async (req, res) => {
  const records = await prisma.gameRecord.findMany({
    where: {
      OR: [
        { blackUserId: req.user.id },
        { whiteUserId: req.user.id }
      ]
    },
    select: {
      id: true,
      roomCode: true,
      blackUserId: true,
      whiteUserId: true,
      blackName: true,
      whiteName: true,
      resultText: true,
      winnerColor: true,
      resultReason: true,
      moveCount: true,
      blackCharacter: true,
      whiteCharacter: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });
  res.json({
    records: records.map((record) => ({
      id: record.id,
      roomCode: record.roomCode,
      blackUserId: record.blackUserId,
      whiteUserId: record.whiteUserId,
      blackName: record.blackName,
      whiteName: record.whiteName,
      resultText: record.resultText,
      winnerColor: record.winnerColor,
      resultReason: record.resultReason,
      moveCount: record.moveCount,
      blackCharacter: record.blackCharacter,
      whiteCharacter: record.whiteCharacter,
      createdAt: record.createdAt
    }))
  });
});

app.get("/api/replays/:id", authHttp, async (req, res) => {
  const record = await prisma.gameRecord.findUnique({ where: { id: req.params.id } });
  if (!record) {
    res.status(404).json({ error: "\u68cb\u8c31\u4e0d\u5b58\u5728" });
    return;
  }
  res.json({ record: { ...record, snapshot: JSON.parse(record.snapshot) } });
});

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

function lobbyStats() {
  return {
    onlineCount: onlineSessions?.onlineCount?.() ?? 0,
    matchmakingCount: matchmakingCount()
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

  socket.on("match:join", async () => {
    try {
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
        { user: socket.user, socketId: socket.id },
        io,
        { canPair: (candidate) => !blockedCandidateIds.has(candidate.user.id) }
      );
      if (!room) socket.emit("match:waiting", { startedAt: Date.now() });
      broadcastLobbyStats();
    } catch (error) {
      socket.emit("error:toast", "鐧诲綍鐘舵€佸凡澶辨晥锛岃閲嶆柊鐧诲綍");
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
      socket.emit("error:toast", "鎴块棿涓嶅瓨鍦ㄦ垨宸茬粡鍏抽棴");
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

  socket.on("duel:request", async ({ targetUserId } = {}) => {
    try {
      await refreshSocketUser(socket);
      await duelRequests.handleRequest(socket, String(targetUserId ?? ""));
    } catch (error) {
      socket.emit("error:toast", "鐧诲綍鐘舵€佸凡澶辨晥锛岃閲嶆柊鐧诲綍");
    }
  });

  socket.on("duel:respond", async ({ requestId, accepted } = {}) => {
    try {
      await refreshSocketUser(socket);
      await duelRequests.handleResponse(socket, String(requestId ?? ""), Boolean(accepted));
      broadcastLobbyStats();
    } catch (error) {
      socket.emit("error:toast", "鐧诲綍鐘舵€佸凡澶辨晥锛岃閲嶆柊鐧诲綍");
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

async function sendLoginResponse(res, user) {
  const response = await onlineSessions.createLoginResponse(user);
  res.setHeader("Set-Cookie", buildRefreshCookie(response.refreshToken));
  const { refreshToken, refreshExpiresAt, ...publicResponse } = response;
  res.json(publicResponse);
}

async function forceLogoutUser(userId) {
  await onlineSessions.forceLogoutUser(userId);
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

async function characterMap() {
  const list = await listPublicCharacters(prisma);
  return Object.fromEntries(list.map((character) => [character.id, character]));
}

async function characterSelectionData() {
  const [characters, records] = await Promise.all([
    characterMap(),
    prisma.character.findMany({ select: { slug: true, enabled: true } })
  ]);
  return {
    characters,
    disabledSlugs: new Set(records.filter((record) => !record.enabled).map((record) => record.slug))
  };
}

async function publicUserWithHistory(user) {
  const records = await prisma.gameRecord.findMany({
    where: {
      OR: [
        { blackUserId: user.id },
        { whiteUserId: user.id }
      ]
    },
    select: {
      blackUserId: true,
      whiteUserId: true,
      winnerColor: true,
      resultText: true
    }
  });
  return publicUserWithRecordStats(user, records);
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
