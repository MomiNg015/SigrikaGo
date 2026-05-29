import { describe, expect, it, vi } from "vitest";
import { createSocketHandlers } from "./socketHandlers.js";

describe("socket handlers", () => {
  it("handles match found by closing overlays, syncing the user, and storing the transition", () => {
    const roomView = { code: "12345", players: [] };
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    handlers.matchFound(roomView);

    expect(deps.closeAllOverlays).toHaveBeenCalledOnce();
    expect(deps.setReplayStep).toHaveBeenCalledWith(null);
    expect(deps.setMatchStart).toHaveBeenCalledWith(null);
    expect(deps.updateUser).toHaveBeenCalledOnce();
    expect(deps.matchSuccessRef.current).toMatchObject({ room: roomView });
    expect(deps.setMatchSuccess).toHaveBeenCalledWith(deps.matchSuccessRef.current);
  });

  it("keeps room updates in a pending match transition instead of entering the room", () => {
    const roomView = { code: "12345", players: [] };
    const deps = handlerDeps({
      syncPendingMatchRoom: vi.fn(() => true)
    });
    const handlers = createSocketHandlers(deps);

    handlers.roomUpdate(roomView);

    expect(deps.updateUser).toHaveBeenCalledOnce();
    expect(deps.setRoom).not.toHaveBeenCalled();
    expect(deps.setView).not.toHaveBeenCalled();
  });

  it("clears live room state when the server closes a room", () => {
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    handlers.roomClosed({ message: "closed" });

    expect(deps.clearLastRoomCode).toHaveBeenCalledOnce();
    expect(deps.setRoom).toHaveBeenCalledWith(null);
    expect(deps.setReplayStep).toHaveBeenCalledWith(null);
    expect(deps.setPendingSkill).toHaveBeenCalledWith(false);
    expect(deps.setView).toHaveBeenCalledWith("home");
    expect(deps.showToast).toHaveBeenCalledWith("closed");
  });

  it("resets app state after account logout", () => {
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    handlers.accountLoggedOut({ message: "bye" });

    expect(deps.clearLastRoomCode).toHaveBeenCalledOnce();
    expect(deps.setToken).toHaveBeenCalledWith("");
    expect(deps.setUser).toHaveBeenCalledWith(null);
    expect(deps.setRoom).toHaveBeenCalledWith(null);
    expect(deps.setMatchStart).toHaveBeenCalledWith(null);
    expect(deps.setMatchSuccess).toHaveBeenCalledWith(null);
    expect(deps.setReplayStep).toHaveBeenCalledWith(null);
    expect(deps.setPendingSkill).toHaveBeenCalledWith(false);
    expect(deps.setLobbyStats).toHaveBeenCalledWith({ onlineCount: 0, matchmakingCount: 0 });
    expect(deps.closeAllOverlays).toHaveBeenCalledOnce();
    expect(deps.setView).toHaveBeenCalledWith("login");
    expect(deps.showToast).toHaveBeenCalledWith("bye");
  });

  it("stores lobby stats from the socket", () => {
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    handlers.lobbyStats({ onlineCount: 3, matchmakingCount: 2 });

    expect(deps.setLobbyStats).toHaveBeenCalledWith({ onlineCount: 3, matchmakingCount: 2 });
  });

  it("returns to login when socket authentication fails during reconnect", () => {
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    handlers.connectError({ message: "unauthorized" });

    expect(deps.clearLastRoomCode).toHaveBeenCalledOnce();
    expect(deps.setToken).toHaveBeenCalledWith("");
    expect(deps.setUser).toHaveBeenCalledWith(null);
    expect(deps.setRoom).toHaveBeenCalledWith(null);
    expect(deps.setMatchStart).toHaveBeenCalledWith(null);
    expect(deps.setMatchSuccess).toHaveBeenCalledWith(null);
    expect(deps.setReplayStep).toHaveBeenCalledWith(null);
    expect(deps.setPendingSkill).toHaveBeenCalledWith(false);
    expect(deps.setView).toHaveBeenCalledWith("login");
    expect(deps.showToast).toHaveBeenCalledWith("登录已失效，请重新登录");
  });
});

function handlerDeps(overrides = {}) {
  return {
    matchSuccessRef: { current: null },
    roomRef: { current: null },
    audioSettingsRef: { current: {} },
    closeAllOverlays: vi.fn(),
    updateUser: vi.fn(),
    setMatchStart: vi.fn(),
    setMatchSuccess: vi.fn(),
    setReplayStep: vi.fn(),
    setRoom: vi.fn(),
    setView: vi.fn(),
    setPendingSkill: vi.fn(),
    setDismissedResultRoom: vi.fn(),
    setIncomingDuel: vi.fn(),
    setToken: vi.fn(),
    setUser: vi.fn(),
    setLobbyStats: vi.fn(),
    showToast: vi.fn(),
    clearLastRoomCode: vi.fn(),
    handleMissingRoomResumePayload: vi.fn(() => false),
    handleRoomResumePayload: vi.fn(() => false),
    mergeCurrentUserFromRoom: vi.fn((current) => current),
    syncPendingMatchRoom: vi.fn(() => false),
    applyRoomClock: vi.fn((room) => room),
    playDoorbellSound: vi.fn(),
    now: () => 1000,
    ...overrides
  };
}
