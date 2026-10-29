// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import BattleAssetPreloadScreen from "./BattleAssetPreloadScreen.jsx";
import { preloadLoginAssets } from "../shared/preloadAssets.js";
vi.mock("../shared/preloadAssets.js", () => ({ battlePreloadAssets: () => ({}), preloadLoginAssets: vi.fn() }));
vi.mock("./playableReadyPreload.js", () => ({ preloadPlayableReady: async () => ({ coreOk: true, pixiOk: true }) }));
vi.mock("./AssetPreloadScreen.jsx", () => ({ default: ({ statusText }) => <div>{statusText}</div> }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it("does not acknowledge failed assets; retries in place and acknowledges only when ready", async () => {
  preloadLoginAssets.mockRejectedValueOnce(new Error("offline"));
  let release;
  preloadLoginAssets.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
  const socket = { on: vi.fn(), off: vi.fn(), emit: vi.fn((_event, _payload, ack) => ack({ ok: true })) };
  render(<BattleAssetPreloadScreen socket={socket} matchSuccess={{ room: { code: "r", mode: "classic", players: [] } }} user={{ id: "u" }} />);
  fireEvent.click(await screen.findByRole("button", { name: "重新加载" }));
  await waitFor(() => expect(preloadLoginAssets).toHaveBeenCalledTimes(2));
  expect(socket.emit).not.toHaveBeenCalled();
  await act(async () => release());
  expect(socket.emit).toHaveBeenCalledWith("room:preload-ready", { roomCode: "r" }, expect.any(Function));
  expect(preloadLoginAssets.mock.calls[0][1].requireComplete).toBe(true);
});
it("never reports ready after leaving the loading screen", async () => {
  let release;
  preloadLoginAssets.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
  const socket = { emit: vi.fn() };
  const { unmount } = render(<BattleAssetPreloadScreen socket={socket} matchSuccess={{ room: { code: "r", players: [] } }} />);
  unmount();
  await act(async () => release());
  expect(socket.emit).not.toHaveBeenCalled();
});
