import { expect, test } from "@playwright/test";
import { io } from "socket.io-client";

const LAST_ROOM_CODE_KEY = "sigrika-last-room-code";

test("recovers an active room after page reload", async ({ baseURL, browser, page }) => {
  const serverUrl = baseURL ?? "http://127.0.0.1:4173";
  const secondContext = await browser.newContext();
  const sockets = [];
  let roomCode = "";

  try {
    const firstAuth = await registerPlayer(page.context(), "a");
    const secondAuth = await registerPlayer(secondContext, "b");
    const firstSocket = await connectSocket(serverUrl, firstAuth.token);
    const secondSocket = await connectSocket(serverUrl, secondAuth.token);
    sockets.push(firstSocket, secondSocket);

    roomCode = await createPreparedRoom(firstSocket, secondSocket);
    await page.addInitScript(({ key, code }) => {
      localStorage.setItem(key, code);
    }, { key: LAST_ROOM_CODE_KEY, code: roomCode });

    await page.goto("/");
    await expectRecoveredBoard(page);
    await expect(page.locator(".app-error-boundary")).toHaveCount(0);

    await page.reload();
    await expectRecoveredBoard(page);
    await expect(page.locator(".app-error-boundary")).toHaveCount(0);
  } finally {
    if (roomCode) {
      for (const socket of sockets) {
        socket.emit("game:action", { roomCode, action: { type: "resign" } });
      }
    }
    for (const socket of sockets) socket.disconnect();
    await secondContext.close();
  }
});

async function expectRecoveredBoard(page) {
  await expect(page.locator(".board-wrap")).toBeVisible({ timeout: 45_000 });
}

async function registerPlayer(context, suffix) {
  const username = `st${Date.now().toString(36).slice(-4)}${suffix}`;
  const response = await context.request.post("/api/auth/register", {
    data: {
      username,
      password: "pwpass12"
    }
  });
  expect(response.status()).toBe(200);
  return response.json();
}

function connectSocket(serverUrl, token) {
  return new Promise((resolve, reject) => {
    const socket = io(serverUrl, {
      auth: { token },
      reconnection: false,
      timeout: 6000,
      transports: ["websocket"]
    });
    const cleanup = () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
    };
    const handleConnect = () => {
      cleanup();
      resolve(socket);
    };
    const handleConnectError = (error) => {
      cleanup();
      socket.disconnect();
      reject(error);
    };
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
  });
}

async function createPreparedRoom(firstSocket, secondSocket) {
  const firstFound = waitForSocketEvent(firstSocket, "match:found");
  const secondFound = waitForSocketEvent(secondSocket, "match:found");
  firstSocket.emit("match:join", { mode: "spark" });
  secondSocket.emit("match:join", { mode: "spark" });
  const [firstRoom] = await Promise.all([firstFound, secondFound]);
  const roomCode = firstRoom.code;

  await emitWithAck(firstSocket, "room:preload-ready", { roomCode });
  await emitWithAck(secondSocket, "room:preload-ready", { roomCode });
  await waitForRoomPhase(firstSocket, roomCode, "playing");
  return roomCode;
}

function emitWithAck(socket, eventName, payload) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(`${eventName} ack timed out`)), 8000);
    socket.emit(eventName, payload, (response = {}) => {
      clearTimeout(timeoutId);
      if (response.ok === false) reject(new Error(response.error ?? `${eventName} failed`));
      else resolve(response);
    });
  });
}

async function waitForRoomPhase(socket, roomCode, expectedPhase) {
  const deadline = Date.now() + 12_000;
  let lastPhase = "";
  while (Date.now() < deadline) {
    const room = await requestRoomSnapshot(socket, roomCode);
    lastPhase = room?.game?.phase ?? "";
    if (lastPhase === expectedPhase) return room;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Expected room ${roomCode} to reach ${expectedPhase}, last phase was ${lastPhase}`);
}

function requestRoomSnapshot(socket, roomCode) {
  const snapshot = waitForSocketEvent(socket, "room:update", (room) => room?.code === roomCode);
  socket.emit("room:resume", { roomCode });
  return snapshot;
}

function waitForSocketEvent(socket, eventName, predicate = () => true) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`${eventName} timed out`));
    }, 10_000);
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
