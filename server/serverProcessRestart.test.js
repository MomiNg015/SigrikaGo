import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { io } from "socket.io-client";
import { afterEach, describe, expect, it } from "vitest";
import { preparePlaywrightTestDatabase } from "../scripts/playwrightTestDatabase.mjs";

const activeChildren = new Set();

describe("server process restart recovery", () => {
  afterEach(async () => {
    await Promise.all([...activeChildren].map((child) => stopServer(child).catch(() => {})));
  });

  it("restores an acknowledged move from SQLite after a real process restart", async () => {
    const port = await findFreePort();
    const database = await preparePlaywrightTestDatabase({
      label: "process-restart",
      port,
      runId: `${process.pid}-${Date.now()}`
    });
    const url = `http://127.0.0.1:${port}`;
    let firstSocket;
    let secondSocket;
    let resumedSocket;
    try {
      let server = startServer({ port, databaseUrl: database.databaseUrl });
      await waitForReady(url, server);

      const firstAuth = await register(url, "a");
      const secondAuth = await register(url, "b");
      firstSocket = await connectSocket(url, firstAuth.token);
      secondSocket = await connectSocket(url, secondAuth.token);
      const firstFound = waitForEvent(firstSocket, "match:found");
      const secondFound = waitForEvent(secondSocket, "match:found");
      firstSocket.emit("match:join", { mode: "standard" });
      secondSocket.emit("match:join", { mode: "standard" });
      const [firstRoom, secondRoom] = await Promise.all([firstFound, secondFound]);
      const roomCode = firstRoom.code;

      await Promise.all([
        emitWithAck(firstSocket, "room:preload-ready", { roomCode }),
        emitWithAck(secondSocket, "room:preload-ready", { roomCode })
      ]);
      const playingRoom = await waitForRoomPhase(firstSocket, roomCode, "playing");
      const blackUserId = playingRoom.players.find((player) => player.color === "black")?.user?.id;
      const blackSocket = blackUserId === firstAuth.user.id ? firstSocket : secondSocket;
      const blackToken = blackUserId === firstAuth.user.id ? firstAuth.token : secondAuth.token;
      const actionId = `restart:${Date.now()}`;
      const acknowledgement = await emitWithAck(blackSocket, "game:action", {
        roomCode,
        actionId,
        action: { type: "move", pointId: "0,0" }
      });
      expect(acknowledgement).toMatchObject({ ok: true, actionId, roomCode });
      const movedRoom = await requestRoomSnapshot(blackSocket, roomCode);
      expect(movedRoom.game.moveNumber).toBeGreaterThanOrEqual(1);
      expect(movedRoom.game.points.find((point) => point.id === "0,0")?.stone).toBe("black");

      firstSocket.disconnect();
      secondSocket.disconnect();
      firstSocket = null;
      secondSocket = null;
      await stopServer(server);
      server = startServer({ port, databaseUrl: database.databaseUrl });
      await waitForReady(url, server);

      resumedSocket = await connectSocket(url, blackToken);
      const restoredRoom = await requestRoomSnapshot(resumedSocket, roomCode);
      expect(restoredRoom.game.moveNumber).toBeGreaterThanOrEqual(1);
      expect(restoredRoom.game.phase).toBe("playing");
      expect(restoredRoom.game.turn).toBe("white");
      expect(restoredRoom.game.points.find((point) => point.id === "0,0")?.stone).toBe("black");
      const duplicateAcknowledgement = await emitWithAck(resumedSocket, "game:action", {
        roomCode,
        actionId,
        action: { type: "move", pointId: "0,0" }
      });
      expect(duplicateAcknowledgement).toEqual(acknowledgement);
      const deduplicatedRoom = await requestRoomSnapshot(resumedSocket, roomCode);
      expect(deduplicatedRoom.game.moveNumber).toBe(restoredRoom.game.moveNumber);
    } finally {
      firstSocket?.disconnect();
      secondSocket?.disconnect();
      resumedSocket?.disconnect();
      await Promise.all([...activeChildren].map((child) => stopServer(child).catch(() => {})));
      database.cleanup();
    }
  }, 45_000);
});

function startServer({ port, databaseUrl }) {
  const child = spawn(process.execPath, [path.resolve("scripts/start-stability-server.mjs")], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_URL: databaseUrl,
      LOCAL_PROD_STATIC: "0",
      JWT_SECRET: "restart-test-secret-012345678901234",
      PUBLIC_ORIGIN: `http://127.0.0.1:${port}`
    },
    stdio: ["ignore", "pipe", "pipe", "ipc"]
  });
  child.logs = "";
  child.stdout.on("data", (chunk) => { child.logs += chunk; });
  child.stderr.on("data", (chunk) => { child.logs += chunk; });
  activeChildren.add(child);
  child.once("exit", () => activeChildren.delete(child));
  return child;
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  child.send?.({ type: "shutdown" });
  await waitForExit(child, 10_000);
}

async function waitForReady(url, child) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Server exited early (${child.exitCode}):\n${child.logs}`);
    try {
      const response = await fetch(`${url}/health/ready`);
      if (response.ok) return;
    } catch {
      // The listener may not be ready yet.
    }
    await delay(100);
  }
  throw new Error(`Server readiness timed out:\n${child.logs}`);
}

async function register(url, suffix) {
  const username = `r${Date.now().toString(36).slice(-5)}${suffix}`;
  const response = await fetch(`${url}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password: "pwpass12" })
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`Register failed (${response.status}): ${JSON.stringify(body)}`);
  return body;
}

function connectSocket(url, token) {
  return new Promise((resolve, reject) => {
    const socket = io(url, {
      auth: { token },
      reconnection: false,
      timeout: 6000,
      transports: ["websocket"]
    });
    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", reject);
  });
}

async function waitForRoomPhase(socket, roomCode, phase) {
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    const room = await requestRoomSnapshot(socket, roomCode);
    if (room?.game?.phase === phase) return room;
    await delay(200);
  }
  throw new Error(`Room ${roomCode} did not reach phase ${phase}`);
}

function requestRoomSnapshot(socket, roomCode) {
  const snapshot = waitForEvent(socket, "room:update", (room) => room?.code === roomCode);
  socket.emit("room:resume", { roomCode, resumeReason: "restart-test" });
  return snapshot;
}

function emitWithAck(socket, eventName, payload) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(`${eventName} acknowledgement timed out`)), 8000);
    socket.emit(eventName, payload, (response = {}) => {
      clearTimeout(timeoutId);
      if (!response.ok) reject(new Error(response.error ?? `${eventName} failed`));
      else resolve(response);
    });
  });
}

function waitForEvent(socket, eventName, predicate = () => true, timeoutMs = 10_000) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`${eventName} timed out`));
    }, timeoutMs);
    const handler = (payload) => {
      if (!predicate(payload)) return;
      cleanup();
      resolve(payload);
    };
    const cleanup = () => {
      clearTimeout(timeoutId);
      socket.off(eventName, handler);
    };
    socket.on(eventName, handler);
  });
}

function waitForExit(child, timeoutMs) {
  return new Promise((resolve, reject) => {
    if (child.exitCode !== null) {
      resolve(child.exitCode);
      return;
    }
    const timeoutId = setTimeout(() => reject(new Error(`Server shutdown timed out:\n${child.logs}`)), timeoutMs);
    child.once("exit", (code) => {
      clearTimeout(timeoutId);
      resolve(code);
    });
  });
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
