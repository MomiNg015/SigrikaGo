import { describe, expect, it, vi } from "vitest";
import { createSocketHandlers, installSocketHandlers } from "./socketHandlers.js";

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

  it("marks the first live player room snapshot after reconnect for audio baselining", () => {
    const roomView = { code: "12345", role: "player", game: { phase: "playing" }, players: [] };
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    handlers.socketReconnect();
    handlers.roomUpdate(roomView);

    expect(deps.setRoom).toHaveBeenCalledWith({
      ...roomView,
      __audioResumeBaseline: true
    });
  });

  it("does not mark normal room updates as audio resumes", () => {
    const roomView = { code: "12345", role: "player", game: { phase: "playing" }, players: [] };
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    handlers.roomUpdate(roomView);

    expect(deps.setRoom).toHaveBeenCalledWith(roomView);
  });

  it("clears remembered player room when an online client receives the finished room update", () => {
    const roomView = { code: "12345", role: "player", game: { phase: "finished" }, players: [] };
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    handlers.roomUpdate(roomView);

    expect(deps.clearLastRoomCode).toHaveBeenCalledOnce();
    expect(deps.setRoom).toHaveBeenCalledWith(roomView);
    expect(deps.setView).toHaveBeenCalledWith("room");
  });

  it("does not merge stale user stats from a restored result snapshot", () => {
    const resultRoom = {
      code: "12345",
      game: { phase: "finished" },
      players: [{ user: { id: "user-1", rating: 980, rank: "1段" } }]
    };
    const deps = handlerDeps({
      handleRoomResumePayload: vi.fn((_payload, handlers) => {
        handlers.setRoom(resultRoom);
        handlers.setView("home");
        return true;
      })
    });
    const handlers = createSocketHandlers(deps);

    handlers.roomResume({ type: "result", room: resultRoom });

    expect(deps.updateUser).not.toHaveBeenCalled();
    expect(deps.setRoom).toHaveBeenCalledWith(resultRoom);
    expect(deps.setView).toHaveBeenCalledWith("home");
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
  it("notifies audio recovery when the socket reconnects", () => {
    const listeners = new Map();
    const socket = {
      on: vi.fn((event, callback) => listeners.set(event, callback)),
      emit: vi.fn()
    };
    const deps = handlerDeps();

    installSocketHandlers(socket, createSocketHandlers(deps), {
      buildRoomResumeRequest: () => ({ roomCode: "12345" }),
      onSocketReconnect: deps.onSocketReconnect
    });
    listeners.get("connect")();

    expect(deps.onSocketReconnect).toHaveBeenCalledOnce();
    expect(socket.emit).toHaveBeenCalledWith("room:resume", { roomCode: "12345" });
  });

  it("routes socket reconnects through room audio snapshot baselining before resume", () => {
    const listeners = new Map();
    const socket = {
      on: vi.fn((event, callback) => listeners.set(event, callback)),
      emit: vi.fn()
    };
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    installSocketHandlers(socket, handlers, {
      buildRoomResumeRequest: () => ({ roomCode: "12345" }),
      onSocketReconnect: deps.onSocketReconnect
    });
    listeners.get("connect")();
    handlers.roomUpdate({ code: "12345", role: "player", game: { phase: "playing" }, players: [] });

    expect(deps.onSocketReconnect).toHaveBeenCalledOnce();
    expect(deps.setRoom).toHaveBeenCalledWith(expect.objectContaining({ __audioResumeBaseline: true }));
    expect(socket.emit).toHaveBeenCalledWith("room:resume", { roomCode: "12345" });
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
    onSocketReconnect: vi.fn(),
    now: () => 1000,
    ...overrides
  };
}
