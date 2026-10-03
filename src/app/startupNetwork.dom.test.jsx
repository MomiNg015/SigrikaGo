// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { useStartupPreload } from "./useStartupPreload.js";
import { useAuthSession } from "./useAuthSession.js";
import ConnectionNotice from "./ConnectionNotice.jsx";
import { api } from "../api/client.js";
vi.mock("../api/client.js", () => ({ api: vi.fn(), configureAuthRefresh: vi.fn() }));
vi.mock("./characterCatalog.js", () => ({ loadPublicCharacterCatalog: async () => ({}) }));
vi.mock("./musicTrackCatalog.js", () => ({ loadMusicTrackCatalog: async () => { throw Object.assign(new Error("503"), { status: 503 }); } }));
vi.mock("../shared/preloadAssets.js", () => ({ loginPreloadAssets: () => [], preloadLoginAssets: async () => {}, retrySkippedPreloadAssets: () => () => {} }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function args() {
  return { token: "valid", fallbackCharacters: {}, matchSuccessRef: { current: null }, roomRef: { current: null }, viewRef: { current: "preloading" },
    refreshSiteSettings: async () => {}, ...Object.fromEntries(["AssetProgress", "Characters", "LobbyStats", "MatchStart", "MatchSuccess", "MusicTracks", "Room", "ShowHouse", "ShowLeaderboard", "ShowShop", "ShowWarehouse", "ShowWatch", "Token", "User", "View", "StartupError"].map((name) => [`set${name}`, vi.fn()])) };
}
describe("startup network recovery", () => {
  test("a music 503 falls back while authenticated startup still enters home", async () => {
    api.mockImplementation(async (url) => url === "/api/me" ? { user: { id: "u" } } : { items: [] });
    const options = args();
    renderHook(() => useStartupPreload(options));
    await waitFor(() => expect(options.setView).toHaveBeenCalledWith("home"), { timeout: 2000 });
    expect(options.setToken).not.toHaveBeenCalled();
    expect(options.setMusicTracks).toHaveBeenCalled();
  });
  test("a me 503 preserves session and a retry restores startup; a confirmed 401 logs out", async () => {
    api.mockRejectedValue(Object.assign(new Error("busy"), { status: 503 }));
    const options = args();
    const { rerender } = renderHook(({ key }) => useStartupPreload({ ...options, retryKey: key }), { initialProps: { key: 0 } });
    await waitFor(() => expect(options.setStartupError).toHaveBeenCalledWith(expect.objectContaining({ source: "preload" })));
    expect(options.setToken).not.toHaveBeenCalled();
    api.mockImplementation(async (url) => url === "/api/me" ? { user: { id: "u" } } : { items: [] });
    rerender({ key: 1 });
    await waitFor(() => expect(options.setView).toHaveBeenCalledWith("home"), { timeout: 2000 });
    api.mockRejectedValue(Object.assign(new Error("expired"), { status: 401 }));
    rerender({ key: 2 });
    await waitFor(() => expect(options.setToken).toHaveBeenCalledWith(""));
  });
  test("a refresh 503 remains retryable without deleting the cached session", async () => {
    api.mockRejectedValue(Object.assign(new Error("unavailable"), { status: 503 }));
    const options = { ...args(), updateUser: vi.fn(), showToast: vi.fn() };
    const { result } = renderHook(() => useAuthSession(options));
    await waitFor(() => expect(options.setStartupError).toHaveBeenCalledWith(expect.objectContaining({ source: "auth" })));
    expect(options.setToken).not.toHaveBeenCalled();
    api.mockResolvedValue({ token: "renewed", user: { id: "u" } });
    await act(async () => { await result.current({ silent: true }); });
    expect(options.setToken).toHaveBeenCalledWith("renewed");
  });
  test("connection loss is visible and its listener is removed on reconnect/unmount", () => {
    const listeners = new Map();
    const socket = { connected: true, on: (event, callback) => listeners.set(event, callback), off: vi.fn() };
    const { unmount } = render(<ConnectionNotice socket={socket} />);
    expect(screen.queryByRole("status")).toBeNull();
    act(() => listeners.get("disconnect")());
    expect(screen.getByRole("status").textContent).toContain("正在重连");
    act(() => listeners.get("connect")());
    expect(screen.queryByRole("status")).toBeNull();
    unmount();
    expect(socket.off).toHaveBeenCalledTimes(3);
    const retry = vi.fn();
    render(<ConnectionNotice startupError={{ message: "加载失败" }} onRetry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
