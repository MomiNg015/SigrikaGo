import { expect, test } from "@playwright/test";
import {
  connectSocket,
  createPreparedRoom,
  createStabilityBrowserContext,
  emitGameActionAndWait,
  expectRecoveredBoard,
  recoverRoomInPage,
  registerPlayer,
  socketForColor,
  waitForRoomPhase
} from "./helpers.js";

const VALID_RESULT_OPENING_MOVES = [
  "0,0",
  "12,12",
  "0,2",
  "12,10",
  "2,0",
  "10,12",
  "2,2",
  "10,10",
  "4,4",
  "8,8",
  "6,6"
];

test("does not reopen the result modal after leaving a finished room and reloading", async ({ baseURL, browser, page }) => {
  const serverUrl = baseURL ?? "http://127.0.0.1:4173";
  const secondContext = await createStabilityBrowserContext(browser);
  const sockets = [];
  let roomCode = "";

  try {
    const firstAuth = await registerPlayer(page.context(), "fa");
    const secondAuth = await registerPlayer(secondContext, "fb");
    const firstSocket = await connectSocket(serverUrl, firstAuth.token);
    const secondSocket = await connectSocket(serverUrl, secondAuth.token);
    sockets.push(firstSocket, secondSocket);

    const prepared = await createPreparedRoom(firstSocket, secondSocket);
    roomCode = prepared.roomCode;
    const authSocketPairs = [
      { auth: firstAuth, socket: firstSocket },
      { auth: secondAuth, socket: secondSocket }
    ];
    const blackSocket = socketForColor(prepared.room, authSocketPairs, "black");
    const whiteSocket = socketForColor(prepared.room, authSocketPairs, "white");
    expect(blackSocket).toBeTruthy();
    expect(whiteSocket).toBeTruthy();

    for (const [index, pointId] of VALID_RESULT_OPENING_MOVES.entries()) {
      const actor = index % 2 === 0 ? blackSocket : whiteSocket;
      await emitGameActionAndWait(actor, roomCode, { type: "move", pointId }, (room) => (
        room?.game?.moveNumber === index + 1
      ));
    }

    await recoverRoomInPage(page, roomCode);

    await emitGameActionAndWait(secondSocket, roomCode, { type: "resign" }, (room) => (
      room?.game?.phase === "finished" && room?.game?.winner && !room.game.winner.invalid
    ));
    await expect(page.locator(".result-modal")).toBeVisible({ timeout: 20_000 });
    await page.locator(".result-modal button").click();
    await page.locator(".room-mobile-exit").click();
    await expect(page.locator(".result-modal")).toHaveCount(0);

    await page.reload();

    await expect(page.locator(".result-modal")).toHaveCount(0);
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

test("does not show a rate-limit toast when the opponent reconnects", async ({ baseURL, browser, page }) => {
  const serverUrl = baseURL ?? "http://127.0.0.1:4173";
  const secondContext = await createStabilityBrowserContext(browser);
  const sockets = [];
  let roomCode = "";
  let opponentSocket = null;

  try {
    const firstAuth = await registerPlayer(page.context(), "ra");
    const secondAuth = await registerPlayer(secondContext, "rb");
    const firstSocket = await connectSocket(serverUrl, firstAuth.token);
    opponentSocket = await connectSocket(serverUrl, secondAuth.token);
    sockets.push(firstSocket, opponentSocket);

    ({ roomCode } = await createPreparedRoom(firstSocket, opponentSocket));
    await recoverRoomInPage(page, roomCode);
    await expectRecoveredBoard(page);

    for (let index = 0; index < 5; index += 1) {
      opponentSocket.disconnect();
      await page.waitForTimeout(150);
      opponentSocket = await connectSocket(serverUrl, secondAuth.token);
      sockets.push(opponentSocket);
      opponentSocket.emit("room:resume", { roomCode });
      await waitForRoomPhase(opponentSocket, roomCode, "playing");
    }

    await page.waitForTimeout(1200);
    await expect(page.locator(".toast").filter({ hasText: /操作.*频繁/ })).toHaveCount(0);
    await expect(page.locator(".app-error-boundary")).toHaveCount(0);
    await expectRecoveredBoard(page);
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
