import { expect, test } from "@playwright/test";
import {
  connectSocket,
  createPreparedRoom,
  createStabilityBrowserContext,
  emitGameActionAndWait,
  expectRealPixiCanvas,
  recoverRoomInPage,
  registerPlayer,
  socketForColor,
  waitForRoomPhase
} from "./helpers.js";

test("plays a real Pixi canvas for Sigrika skill effects in spark matches", async ({ baseURL, browser, page }) => {
  const serverUrl = baseURL ?? "http://127.0.0.1:4173";
  const secondContext = await createStabilityBrowserContext(browser);
  const sockets = [];
  const pageErrors = [];
  let roomCode = "";

  try {
    const firstAuth = await registerPlayer(page.context(), "sh", { characterId: "sigrika" });
    const secondAuth = await registerPlayer(secondContext, "sv", { characterId: "sigrika" });
    const firstSocket = await connectSocket(serverUrl, firstAuth.token);
    const secondSocket = await connectSocket(serverUrl, secondAuth.token);
    sockets.push(firstSocket, secondSocket);

    const prepared = await createPreparedRoom(firstSocket, secondSocket, { mode: "spark" });
    roomCode = prepared.roomCode;
    const authSocketPairs = [
      { auth: firstAuth, socket: firstSocket },
      { auth: secondAuth, socket: secondSocket }
    ];
    const blackSocket = socketForColor(prepared.room, authSocketPairs, "black");
    const blackPlayer = prepared.room.players.find((candidate) => candidate.color === "black");
    const blackPair = authSocketPairs.find(({ auth }) => auth.user?.id === blackPlayer?.user?.id);
    const observerPage = blackPair?.auth === firstAuth ? page : await secondContext.newPage();
    observerPage.on("pageerror", (error) => pageErrors.push(error.message));
    expect(blackSocket).toBeTruthy();

    await recoverRoomInPage(observerPage, roomCode);
    blackSocket.emit("game:action", { roomCode, action: { type: "skill", pointId: "6,6" } });
    await expectRealPixiCanvas(observerPage, "erase-point");

    await expect(observerPage.locator(".app-error-boundary")).toHaveCount(0);
    expect(pageErrors).toEqual([]);
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

test("plays real Pixi skill canvases for Aemeath hidden-hand and voyage-star", async ({ baseURL, browser, page }) => {
  const serverUrl = baseURL ?? "http://127.0.0.1:4173";
  const secondContext = await createStabilityBrowserContext(browser);
  const sockets = [];
  const pageErrors = [];
  let roomCode = "";

  try {
    const firstAuth = await registerPlayer(page.context(), "ah", { characterId: "aemeath" });
    const secondAuth = await registerPlayer(secondContext, "av", { characterId: "aemeath" });
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
    const blackPlayer = prepared.room.players.find((candidate) => candidate.color === "black");
    const blackPair = authSocketPairs.find(({ auth }) => auth.user?.id === blackPlayer?.user?.id);
    const observerPage = blackPair?.auth === firstAuth ? page : await secondContext.newPage();
    observerPage.on("pageerror", (error) => pageErrors.push(error.message));
    expect(blackSocket).toBeTruthy();
    expect(whiteSocket).toBeTruthy();

    await recoverRoomInPage(observerPage, roomCode);
    await expect(observerPage.locator(".app-error-boundary")).toHaveCount(0);

    blackSocket.emit("game:action", { roomCode, action: { type: "skill", pointId: "6,6" } });
    await expectRealPixiCanvas(observerPage, "hidden-hand");
    await waitForRoomPhase(whiteSocket, roomCode, "playing");

    await emitGameActionAndWait(whiteSocket, roomCode, { type: "move", pointId: "0,0" }, (room) => (
      room.game?.phase === "playing" && room.game?.turn === "black"
    ));
    blackSocket.emit("game:action", { roomCode, action: { type: "skill" } });
    await expectRealPixiCanvas(observerPage, "voyage-star");

    await expect(observerPage.locator(".app-error-boundary")).toHaveCount(0);
    expect(pageErrors).toEqual([]);
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
