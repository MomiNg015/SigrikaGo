import { expect, test } from "@playwright/test";
import {
  createPreparedRoom,
  createStabilityBrowserContext,
  expectRecoveredBoard,
  LAST_ROOM_CODE_KEY,
  registerPlayer,
  connectSocket
} from "./helpers.js";

test("recovers an active room after reload and disables actions while offline", async ({ baseURL, browser, page }, testInfo) => {
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
    const resign = page.getByRole("button", { name: "认输", exact: true });
    await expect(resign).toBeEnabled();
    await page.context().setOffline(true);
    await expect(page.locator(".connection-notice")).toContainText("连接已断开");
    const actions = page.getByRole("navigation", { name: "对弈操作" }).getByRole("button");
    await expect(actions).toHaveCount(5);
    for (const button of await actions.all()) await expect(button).toBeDisabled();
    await page.screenshot({ path: testInfo.outputPath("room-offline-actions-disabled.png") });
    await page.context().setOffline(false);
    await expect(page.locator(".connection-notice")).toHaveCount(0, { timeout: 20_000 });
    await expect(resign).toBeEnabled();
    await expectRecoveredBoard(page);
    await page.screenshot({ path: testInfo.outputPath("room-actions-restored.png") });
  } finally {
    await page.context().setOffline(false);
    if (roomCode) {
      for (const socket of sockets) {
        socket.emit("game:action", { roomCode, action: { type: "resign" } });
      }
    }
    for (const socket of sockets) socket.disconnect();
    await secondContext.close();
  }
});
