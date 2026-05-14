import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { prisma, publicUser } from "./db.js";
import {
  addChat,
  attachSocketToRoom,
  broadcastRoom,
  detachSocket,
  getRoom,
  handleGameAction,
  handleScoringAction,
  joinMatchmaking,
  leaveMatchmaking,
  requestCounting,
  respondCounting,
  roomView
} from "./rooms.js";

const app = express();
const server = createServer(app);
const PORT = Number(process.env.PORT ?? 3001);
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/register", async (req, res) => {
  const username = String(req.body.username ?? "").trim();
  const password = String(req.body.password ?? "");
  if (username.length < 2 || password.length < 4) {
    res.status(400).json({ error: "用户名至少2位，密码至少4位" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({ data: { username, passwordHash } });
    res.json(withToken(user));
  } catch {
    res.status(409).json({ error: "用户名已存在" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const username = String(req.body.username ?? "").trim();
  const password = String(req.body.password ?? "");
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "用户名或密码错误" });
    return;
  }
  res.json(withToken(user));
});

app.get("/api/me", authHttp, async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.post("/api/me/character", authHttp, async (req, res) => {
  const characterId = String(req.body.characterId ?? "");
  if (!["sigrika", "danea"].includes(characterId)) {
    res.status(400).json({ error: "未知角色" });
    return;
  }
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { selectedCharacter: characterId }
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
      moveCount: record.moveCount,
      createdAt: record.createdAt
    }))
  });
});

app.get("/api/replays/:id", authHttp, async (req, res) => {
  const record = await prisma.gameRecord.findUnique({ where: { id: req.params.id } });
  if (!record || (record.blackUserId !== req.user.id && record.whiteUserId !== req.user.id)) {
    res.status(404).json({ error: "棋谱不存在" });
    return;
  }
  res.json({ record: { ...record, snapshot: JSON.parse(record.snapshot) } });
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new Error("user not found");
    socket.user = publicUser(user);
    next();
  } catch {
    next(new Error("unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.emit("me", socket.user);

  socket.on("match:join", () => {
    const room = joinMatchmaking({ user: socket.user, socketId: socket.id }, io);
    if (!room) socket.emit("match:waiting", { startedAt: Date.now() });
  });

  socket.on("match:leave", () => {
    leaveMatchmaking(socket.user.id);
    socket.emit("match:left");
  });

  socket.on("room:join", ({ roomCode }) => {
    const room = attachSocketToRoom(roomCode, socket, socket.user);
    if (!room) {
      socket.emit("error:toast", "房间不存在或已经关闭");
      return;
    }
    socket.emit("room:update", roomView(room, socket.user.id));
    broadcastRoom(io, room);
  });

  socket.on("game:action", (payload) => {
    const result = handleGameAction(payload.roomCode, socket.user.id, payload.action, io);
    sendResult(socket, result);
    if (result.ok) broadcastRoom(io, result.room);
  });

  socket.on("counting:request", ({ roomCode }) => {
    const result = requestCounting(roomCode, socket.user.id, io);
    sendResult(socket, result);
    if (result.ok) broadcastRoom(io, result.room);
  });

  socket.on("counting:respond", ({ roomCode, accepted }) => {
    const result = respondCounting(roomCode, socket.user.id, accepted);
    sendResult(socket, result);
    if (result.ok) broadcastRoom(io, result.room);
  });

  socket.on("scoring:action", (payload) => {
    const result = handleScoringAction(payload.roomCode, socket.user.id, payload.action, io);
    sendResult(socket, result);
    if (result.ok) broadcastRoom(io, result.room);
  });

  socket.on("chat:send", ({ roomCode, text }) => {
    const room = addChat(roomCode, socket.user, text);
    if (room) broadcastRoom(io, room);
  });

  socket.on("disconnect", () => {
    detachSocket(socket.id);
  });
});

function withToken(user) {
  return {
    token: jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "14d" }),
    user: publicUser(user)
  };
}

async function authHttp(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new Error("missing user");
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "请先登录" });
  }
}

function sendResult(socket, result) {
  if (!result.ok) socket.emit("error:toast", result.error);
}

server.listen(PORT, () => {
  console.log(`SigrikaGo server listening on http://localhost:${PORT}`);
});
