import { expect, test } from "@playwright/test";
import {
  createPreparedRoom,
  createStabilityBrowserContext,
  expectRecoveredBoard,
  LAST_ROOM_CODE_KEY,
  registerPlayer,
  connectSocket
} from "./helpers.js";

test("recovers an active room after page reload", async ({ baseURL, browser, page }) => {
  const serverUrl = baseURL ?? "http://127.0.0.1:4173";
  const secondContext = await createStabilityBrowserContext(browser);
  const sockets = [];
  let roomCode = "";

  try {
    const firstAuth = await registerPlayer(page.context(), "a");
    const secondAuth = await registerPlayer(secondContext, "b");
    const firstSocket = await connectSocket(serverUrl, firstAuth.token);
    const secondSocket = await connectSocket(serverUrl, secondAuth.token);
    sockets.push(firstSocket, secondSocket);

    ({ roomCode } = await createPreparedRoom(firstSocket, secondSocket));
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
