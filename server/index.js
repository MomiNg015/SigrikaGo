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
import { listPublicCharacterResponse, listPublicCharacters, seedCharacters } from "./characters.js";
import { CHARACTERS } from "../src/shared/characters.js";
import { resolveSelectedCharacter } from "./characterSelection.js";
import { authenticateSocketUser } from "./socketAuth.js";
import { createFeedbackMessage } from "./feedback.js";
import { buildLeaderboard } from "./leaderboard.js";
import { publicUserWithRecordStats } from "./userProfile.js";
import { listShopItems, purchaseShopItem, seedBuiltinShopItems } from "./shop.js";
import { getPublicSiteSettings } from "./siteSettings.js";
import { getStoneDecoration } from "../src/shared/stoneDecorations.js";
import {
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
  getRoom,
  handleGameAction,
  handleScoringAction,
  isUserInActiveRoom,
  joinMatchmaking,
  leaveMatchmaking,
  requestCounting,
  requestDraw,
  respondCounting,
  respondDraw,
  roomView
} from "./rooms.js";
import {
  deleteRelationship,
  ensureSocialSchema,
  getUserProfile,
  getUserReplays,
  listSocialUsers,
  RELATIONSHIP_TYPES,
  setRelationship,
  toSocialUser
} from "./social.js";

const app = express();
const server = createServer(app);
const PORT = Number(process.env.PORT ?? 3001);
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
const { authHttp, requireAdmin } = makeAuth({ prisma, jwtSecret: JWT_SECRET });
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "public", "uploads", "characters");
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
app.use("/api/auth", createAuthRateLimit());
app.use("/api", createApiRateLimit());
app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));

const io = new Server(server, {
  cors: corsOptions
});

await seedCharacters(prisma);
await seedBuiltinShopItems(prisma);
await ensureSocialSchema(prisma);
await promoteConfiguredAdmins(prisma);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/characters", async (_req, res) => {
  res.json(await listPublicCharacterResponse(prisma));
});

app.get("/api/shop", authHttp, async (_req, res) => {
  res.json(await listShopItems(prisma));
});
const onlineSockets = new Map();
const pendingDuelRequests = new Map();

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

app.get("/api/leaderboard", authHttp, async (_req, res) => {
  const [users, records] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        rating: true,
        selectedCharacter: true
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

app.get("/api/users/:id/profile", authHttp, async (req, res) => {
  const profile = await getUserProfile({
    prisma,
    userId: req.params.id,
    viewerId: req.user.id,
    statusForUser
  });
  if (!profile) {
    res.status(404).json({ error: "用户不存在" });
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
    res.status(404).json({ error: "用户不存在" });
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
    res.json(withToken(syncedUser, JWT_SECRET));
  } catch {
    res.status(409).json({ error: "用户名已存在" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const usernameResult = validateUsername(req.body.username);
  const passwordResult = validatePassword(req.body.password);
  if (!usernameResult.ok || !passwordResult.ok) {
    res.status(401).json({ error: "用户名或密码错误" });
    return;
  }
  const username = usernameResult.value;
  const password = passwordResult.value;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "用户名或密码错误" });
    return;
  }
  if (user.status === USER_STATUS.banned) {
    res.status(403).json({ error: user.banReason ? `账号已封禁：${user.banReason}` : "账号已封禁" });
    return;
  }
  const syncedUser = await syncConfiguredAdmin(user, prisma);
  res.json(withToken(syncedUser, JWT_SECRET));
});

app.get("/api/me", authHttp, async (req, res) => {
  res.json({ user: await publicUserWithHistory(req.user) });
});

app.post("/api/me/character", authHttp, async (req, res) => {
  const characterId = String(req.body.characterId ?? "");
  const publicProfile = publicUser(req.user);
  if (!publicProfile.ownedCharacters.includes(characterId)) {
    res.status(403).json({ error: "尚未获得该角色" });
    return;
  }
  const { characters, disabledSlugs } = await characterSelectionData();
  if (!characters[characterId] && (disabledSlugs.has(characterId) || !CHARACTERS[characterId])) {
    res.status(400).json({ error: "未知角色" });
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
      res.status(400).json({ error: "未知棋子装饰" });
      return;
    }
    const ownedDecorations = publicUser(req.user).ownedDecorations;
    if (!ownedDecorations.includes(decorationId)) {
      res.status(403).json({ error: "尚未获得该装饰" });
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
    orderBy: { createdAt: "desc" },
    take: 30
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
      blackCharacter: record.blackCharacter,
      whiteCharacter: record.whiteCharacter,
      createdAt: record.createdAt
    }))
  });
});

app.get("/api/replays/:id", authHttp, async (req, res) => {
  const record = await prisma.gameRecord.findUnique({ where: { id: req.params.id } });
  if (!record) {
    res.status(404).json({ error: "棋谱不存在" });
    return;
  }
  res.json({ record: { ...record, snapshot: JSON.parse(record.snapshot) } });
});

io.use(async (socket, next) => {
  try {
    socket.user = await authenticateSocketUser({
      token: socket.handshake.auth?.token,
      jwtSecret: JWT_SECRET,
      prisma,
      characterSelectionData
    });
    next();
  } catch (error) {
    next(new Error(error.message === "forbidden" ? "forbidden" : "unauthorized"));
  }
});

io.on("connection", (socket) => {
  installSocketRateGuard(socket);
  registerOnlineSocket(socket);
  socket.emit("me", socket.user);

  socket.on("match:join", () => {
    const room = joinMatchmaking({ user: socket.user, socketId: socket.id }, io);
    if (!room) socket.emit("match:waiting", { startedAt: Date.now() });
  });

  socket.on("match:leave", () => {
    leaveMatchmaking(socket.user.id);
    socket.emit("match:left");
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

  socket.on("duel:request", ({ targetUserId } = {}) => {
    handleDuelRequest(socket, String(targetUserId ?? ""));
  });

  socket.on("duel:respond", ({ requestId, accepted } = {}) => {
    handleDuelResponse(socket, String(requestId ?? ""), Boolean(accepted));
  });

  socket.on("disconnect", () => {
    unregisterOnlineSocket(socket);
    for (const room of detachSocket(socket.id)) {
      broadcastRoom(io, room);
    }
  });
});

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
      socket.emit("error:toast", "操作过于频繁，请稍后再试");
      return;
    }
    next();
  });
}

function registerOnlineSocket(socket) {
  const sockets = onlineSockets.get(socket.user.id) ?? new Set();
  sockets.add(socket.id);
  onlineSockets.set(socket.user.id, sockets);
}

function unregisterOnlineSocket(socket) {
  const sockets = onlineSockets.get(socket.user.id);
  if (!sockets) return;
  sockets.delete(socket.id);
  if (sockets.size === 0) onlineSockets.delete(socket.user.id);
  for (const [requestId, request] of pendingDuelRequests) {
    if (request.fromSocketId === socket.id || request.targetSocketId === socket.id) expireDuelRequest(requestId);
  }
}

function statusForUser(userId) {
  if (isUserInActiveRoom(userId)) return "playing";
  return onlineSockets.has(userId) ? "online" : "offline";
}

function firstOnlineSocket(userId) {
  const socketId = onlineSockets.get(userId)?.values().next().value;
  return socketId ? io.sockets.sockets.get(socketId) : null;
}

function handleDuelRequest(socket, targetUserId) {
  if (!targetUserId || targetUserId === socket.user.id) {
    socket.emit("error:toast", "不能向自己申请对局");
    return;
  }
  if (isUserInActiveRoom(socket.user.id)) {
    socket.emit("error:toast", "你正在对局中，无法申请对局。");
    return;
  }
  if (isUserInActiveRoom(targetUserId)) {
    socket.emit("duel:unavailable", { targetUserId, reason: "playing" });
    socket.emit("error:toast", "对方正在对局中。");
    return;
  }
  const targetSocket = firstOnlineSocket(targetUserId);
  if (!targetSocket) {
    socket.emit("duel:unavailable", { targetUserId, reason: "offline" });
    socket.emit("error:toast", "对方不在线。");
    return;
  }
  const requestId = crypto.randomUUID();
  const expiresAt = Date.now() + 20000;
  const request = {
    id: requestId,
    fromSocketId: socket.id,
    targetSocketId: targetSocket.id,
    fromUser: socket.user,
    targetUser: targetSocket.user,
    timerId: setTimeout(() => expireDuelRequest(requestId), 20000)
  };
  pendingDuelRequests.set(requestId, request);
  targetSocket.emit("duel:incoming", {
    requestId,
    expiresAt,
    from: toSocialUser(socket.user, statusForUser(socket.user.id))
  });
  socket.emit("duel:sent", {
    requestId,
    target: toSocialUser(targetSocket.user, statusForUser(targetSocket.user.id)),
    expiresAt
  });
}

function handleDuelResponse(socket, requestId, accepted) {
  const request = pendingDuelRequests.get(requestId);
  if (!request || request.targetSocketId !== socket.id) return;
  pendingDuelRequests.delete(requestId);
  clearTimeout(request.timerId);
  const fromSocket = io.sockets.sockets.get(request.fromSocketId);
  if (!fromSocket) return;
  if (!accepted) {
    fromSocket.emit("duel:rejected", { requestId, username: socket.user.username });
    socket.emit("duel:closed", { requestId });
    return;
  }
  if (isUserInActiveRoom(fromSocket.user.id) || isUserInActiveRoom(socket.user.id)) {
    fromSocket.emit("duel:rejected", { requestId, username: socket.user.username, reason: "playing" });
    socket.emit("duel:closed", { requestId });
    return;
  }
  createDirectRoom(
    { user: fromSocket.user, socketId: fromSocket.id },
    { user: socket.user, socketId: socket.id },
    io
  );
  socket.emit("duel:closed", { requestId });
}

function expireDuelRequest(requestId) {
  const request = pendingDuelRequests.get(requestId);
  if (!request) return;
  pendingDuelRequests.delete(requestId);
  clearTimeout(request.timerId);
  io.to(request.fromSocketId).emit("duel:rejected", {
    requestId,
    username: request.targetUser.username,
    reason: "timeout"
  });
  io.to(request.targetSocketId).emit("duel:closed", { requestId });
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

server.listen(PORT, () => {
  console.log(`SigrikaGo server listening on http://localhost:${PORT}`);
});
