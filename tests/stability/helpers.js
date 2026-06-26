import { expect } from "@playwright/test";
import { io } from "socket.io-client";

export const LAST_ROOM_CODE_KEY = "sigrika-last-room-code";
export const DISMISSED_RESULT_ROOM_KEY = "sigrika-dismissed-result-room-code";

export async function registerPlayer(context, suffix, { characterId = "" } = {}) {
  const username = `st${Date.now().toString(36).slice(-4)}${suffix}`;
  const response = await context.request.post("/api/auth/register", {
    data: {
      username,
      password: "pwpass12"
    }
  });
  expect(response.status()).toBe(200);
  const auth = await response.json();
  if (characterId) await selectCharacter(context, auth.token, characterId);
  return auth;
}

export async function selectCharacter(context, token, characterId) {
  const response = await context.request.post("/api/me/character", {
    headers: { Authorization: `Bearer ${token}` },
    data: { characterId }
  });
  expect(response.status()).toBe(200);
  return response.json();
}

export function connectSocket(serverUrl, token) {
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

export async function createPreparedRoom(firstSocket, secondSocket, { mode = "spark" } = {}) {
  const firstFound = waitForSocketEvent(firstSocket, "match:found");
  const secondFound = waitForSocketEvent(secondSocket, "match:found");
  firstSocket.emit("match:join", { mode });
  secondSocket.emit("match:join", { mode });
  const [firstRoom] = await Promise.all([firstFound, secondFound]);
  const roomCode = firstRoom.code;

  await emitWithAck(firstSocket, "room:preload-ready", { roomCode });
  await emitWithAck(secondSocket, "room:preload-ready", { roomCode });
  const room = await waitForRoomPhase(firstSocket, roomCode, "playing");
  return { roomCode, room };
}

export function socketForColor(room, authSocketPairs, color) {
  const player = room?.players?.find((candidate) => candidate.color === color);
  return authSocketPairs.find(({ auth }) => auth.user?.id === player?.user?.id)?.socket ?? null;
}

export async function recoverRoomInPage(page, roomCode) {
  await page.addInitScript(({ code, dismissedKey, lastRoomKey }) => {
    localStorage.removeItem(dismissedKey);
    localStorage.setItem(lastRoomKey, code);
  }, {
    code: roomCode,
    dismissedKey: DISMISSED_RESULT_ROOM_KEY,
    lastRoomKey: LAST_ROOM_CODE_KEY
  });
  await page.goto("/");
  await expectRecoveredBoard(page);
}

export async function expectRecoveredBoard(page) {
  await expect(page.locator(".board-wrap")).toBeVisible({ timeout: 45_000 });
}

export async function expectRealPixiCanvas(page, effectType) {
  const layer = page.locator(`.board-effects-layer[data-effect-type="${effectType}"]`);
  await expect(layer).toBeVisible({ timeout: 8_000 });
  await expect(layer).not.toHaveAttribute("data-effect-failed", "true");
  const canvas = layer.locator(".board-effects-canvas");
  try {
    await expect(canvas).toBeVisible({ timeout: 8_000 });
  } catch (error) {
    const html = await layer.evaluate((element) => element.outerHTML).catch(() => "<layer unavailable>");
    throw new Error(`${error.message}\nBoard effect layer snapshot: ${html}`);
  }
  const box = await canvas.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(20);
  expect(box?.height ?? 0).toBeGreaterThan(20);
}

export async function emitGameActionAndWait(socket, roomCode, action, predicate = () => true) {
  let lastError = "";
  const handleErrorToast = (message) => {
    lastError = String(message ?? "game action failed");
  };
  socket.on("error:toast", handleErrorToast);
  socket.emit("game:action", { roomCode, action });
  const deadline = Date.now() + 10_000;
  try {
    while (Date.now() < deadline) {
      if (lastError) throw new Error(lastError);
      const room = await requestRoomSnapshot(socket, roomCode);
      if (predicate(room)) return room;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    throw new Error(`game:action did not reach expected room state for ${action.type}`);
  } finally {
    socket.off("error:toast", handleErrorToast);
  }
}

export async function waitForRoomPhase(socket, roomCode, expectedPhase) {
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

export function requestRoomSnapshot(socket, roomCode) {
  const snapshot = waitForSocketEvent(socket, "room:update", (room) => room?.code === roomCode);
  socket.emit("room:resume", { roomCode });
  return snapshot;
}

export function waitForSocketEvent(socket, eventName, predicate = () => true, timeoutMs = 10_000) {
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
