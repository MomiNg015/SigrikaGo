import { describe, expect, it, vi } from "vitest";
import {
  ROOM_PATCH_RESUME_DEBOUNCE_MS,
  createSocketHandlers,
  installSocketHandlers
} from "./socketHandlers.js";
import { applyRoomClock } from "./roomClock.js";
import { syncPendingMatchRoom } from "./matchTransition.js";

describe("socket handlers", () => {
  it("stores match waiting payloads from the socket", () => {
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    handlers.matchWaiting({ startedAt: 12345, mode: "standard" });

    expect(matchStartSetterResult(deps)).toEqual({ startedAt: 12345, mode: "standard" });
  });

  it("defaults match waiting mode to spark", () => {
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    handlers.matchWaiting({ startedAt: 12345 });

    expect(matchStartSetterResult(deps)).toEqual({ startedAt: 12345, mode: "spark" });
  });

  it("keeps identical match waiting payloads stable during repeated socket updates", () => {
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);
    const current = { startedAt: 12345, mode: "gomoku" };

    handlers.matchWaiting({ startedAt: 12345, mode: "gomoku" });

    expect(matchStartSetterResult(deps, current)).toBe(current);
  });

  it("handles match found by closing overlays, syncing the user, and storing the transition", () => {
    const roomView = { code: "12345", players: [] };
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    handlers.matchFound(roomView);

    expect(deps.closeAllOverlays).toHaveBeenCalledOnce();
    expect(deps.setReplayStep).toHaveBeenCalledWith(null);
    expect(deps.setMatchStart).toHaveBeenCalledWith(null);
    expect(deps.updateUser).toHaveBeenCalledOnce();
    expect(deps.updateUser).toHaveBeenCalledWith(expect.any(Function));
    expect(deps.matchSuccessRef.current).toMatchObject({ room: roomView });
    expect(deps.setMatchSuccess).toHaveBeenCalledWith(deps.matchSuccessRef.current);
    expect(deps.setView).not.toHaveBeenCalled();
  });

  it("keeps preloading match rooms on the current screen until the countdown completes", () => {
    const roomView = { code: "12345", game: { phase: "preloading" }, players: [] };
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    handlers.matchFound(roomView);

    expect(deps.setView).not.toHaveBeenCalled();
  });

  it("automatically enters the room when a pending match leaves preloading after the countdown completed", () => {
    const pendingRoom = { code: "12345", game: { phase: "preloading" }, players: [] };
    const openingRoom = { code: "12345", role: "player", game: { phase: "opening" }, players: [] };
    const deps = handlerDeps({
      matchSuccessRef: { current: { room: pendingRoom, startedAt: 1000, countdownComplete: true } }
    });
    const handlers = createSocketHandlers(deps);

    handlers.roomUpdate(openingRoom);

    expect(roomSetterResult(deps)).toEqual(openingRoom);
    expect(deps.matchSuccessRef.current).toBeNull();
    expect(deps.setMatchSuccess).toHaveBeenCalledWith(null);
    expect(deps.setView).toHaveBeenCalledWith("room");
  });

  it("keeps a loaded preloading match pending until the match success countdown completes", () => {
    const pendingRoom = { code: "12345", game: { phase: "preloading" }, players: [] };
    const openingRoom = { code: "12345", role: "player", game: { phase: "opening" }, players: [] };
    const deps = handlerDeps({
      matchSuccessRef: { current: { room: pendingRoom, startedAt: 1000, countdownComplete: false } },
      syncPendingMatchRoom
    });
    const handlers = createSocketHandlers(deps);

    handlers.roomUpdate(openingRoom);

    expect(deps.matchSuccessRef.current).toMatchObject({
      room: openingRoom,
      startedAt: 1000,
      countdownComplete: false
    });
    expect(deps.setMatchSuccess).toHaveBeenCalledWith(expect.any(Function));
    expect(deps.setRoom).not.toHaveBeenCalled();
    expect(deps.setView).not.toHaveBeenCalled();
  });

  it("keeps room updates in a pending match transition instead of entering the room", () => {
    const roomView = { code: "12345", players: [] };
    const deps = handlerDeps({
      syncPendingMatchRoom: vi.fn(() => true)
    });
    const handlers = createSocketHandlers(deps);

    handlers.roomUpdate(roomView);

    expect(deps.updateUser).toHaveBeenCalledOnce();
    expect(deps.updateUser).toHaveBeenCalledWith(expect.any(Function));
    expect(deps.setRoom).not.toHaveBeenCalled();
    expect(deps.setView).not.toHaveBeenCalled();
  });

  it("syncs user stats silently when restoring a live room", () => {
    const currentRoom = {
      code: "12345",
      role: "player",
      game: { phase: "playing" },
      players: [],
      __audioResumeBaseline: true
    };
    const roomView = {
      code: "12345",
      role: "player",
      game: { phase: "playing" },
      players: []
    };
    const deps = handlerDeps({
      handleRoomResumePayload: vi.fn((_payload, handlers) => {
        handlers.setRoom({ ...roomView, __audioResumeBaseline: true });
        handlers.setView("room");
        return true;
      })
    });
    const handlers = createSocketHandlers(deps);

    handlers.roomResume({ type: "room", room: roomView });

    expect(deps.updateUser).toHaveBeenCalledOnce();
    expect(deps.updateUser).toHaveBeenCalledWith(expect.any(Function));
    expect(deps.setRoom).toHaveBeenCalledWith(expect.any(Function));
    expect(roomSetterResult(deps, 1, currentRoom)).toBe(currentRoom);
    expect(deps.setView).toHaveBeenCalledWith("room");
  });

  it("marks the first live player room snapshot after reconnect for audio baselining", () => {
    const roomView = { code: "12345", role: "player", game: { phase: "playing" }, players: [] };
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    handlers.socketReconnect();
    handlers.roomUpdate(roomView);

    expect(roomSetterResult(deps)).toEqual({
      ...roomView,
      __audioResumeBaseline: true
    });
  });

  it("keeps duplicate reconnect room snapshots audio-baselined until a new room event arrives", () => {
    const roomView = {
      code: "12345",
      role: "player",
      game: { phase: "playing", history: [{ type: "move" }] },
      chat: [{ id: "start", kind: "game-start" }],
      players: []
    };
    const nextRoomView = {
      ...roomView,
      game: { phase: "playing", history: [{ type: "move" }, { type: "move" }] }
    };
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    handlers.socketReconnect();
    handlers.roomUpdate(roomView);
    handlers.roomUpdate(roomView);
    handlers.roomUpdate(nextRoomView);

    expect(roomSetterResult(deps, 1)).toEqual({
      ...roomView,
      __audioResumeBaseline: true
    });
    expect(roomSetterResult(deps, 2, roomSetterResult(deps, 1))).toBe(roomSetterResult(deps, 1));
    expect(roomSetterResult(deps, 2, roomSetterResult(deps, 1))).toEqual({
      ...roomView,
      __audioResumeBaseline: true
    });
    expect(roomSetterResult(deps, 3, roomSetterResult(deps, 2, roomSetterResult(deps, 1)))).toEqual(nextRoomView);
  });

  it("does not mark normal room updates as audio resumes", () => {
    const roomView = { code: "12345", role: "player", game: { phase: "playing" }, players: [] };
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    handlers.roomUpdate(roomView);

    expect(roomSetterResult(deps)).toBe(roomView);
  });

  it("ignores stale room clock payloads without scheduling room state updates", () => {
    const currentRoom = {
      code: "12345",
      players: [{ color: "black", time: { main: 300 } }]
    };
    const deps = handlerDeps({ roomRef: { current: currentRoom } });
    const handlers = createSocketHandlers(deps);

    handlers.roomClock({
      roomCode: "99999",
      players: [{ color: "black", time: { main: 299 } }]
    });

    expect(deps.setMatchSuccess).not.toHaveBeenCalled();
    expect(deps.setRoom).not.toHaveBeenCalled();
  });

  it("updates only the pending match room for pending match clock payloads", () => {
    const pendingRoom = {
      code: "12345",
      players: [{ color: "black", time: { main: 300 } }]
    };
    const deps = handlerDeps({
      matchSuccessRef: {
        current: {
          room: pendingRoom,
          startedAt: 1000
        }
      },
      applyRoomClock
    });
    const handlers = createSocketHandlers(deps);

    handlers.roomClock({
      roomCode: "12345",
      players: [{ color: "black", time: { main: 299 } }]
    });

    expect(deps.setMatchSuccess).toHaveBeenCalledWith(expect.any(Function));
    expect(deps.setRoom).not.toHaveBeenCalled();
    expect(deps.setMatchSuccess.mock.calls[0][0]({
      room: pendingRoom,
      startedAt: 1000
    }).room.players[0].time.main).toBe(299);
    expect(deps.matchSuccessRef.current.room.players[0].time.main).toBe(299);
  });

  it("ignores unchanged pending match clock payloads before scheduling state", () => {
    const pendingRoom = {
      code: "12345",
      players: [{ color: "black", time: { main: 300 } }]
    };
    const deps = handlerDeps({
      matchSuccessRef: {
        current: {
          room: pendingRoom,
          startedAt: 1000
        }
      },
      applyRoomClock
    });
    const handlers = createSocketHandlers(deps);

    handlers.roomClock({
      roomCode: "12345",
      players: [{ color: "black", time: { main: 300 } }]
    });

    expect(deps.matchSuccessRef.current.room).toBe(pendingRoom);
    expect(deps.setMatchSuccess).not.toHaveBeenCalled();
    expect(deps.setRoom).not.toHaveBeenCalled();
  });

  it("applies room patches without replacing unchanged room slices", () => {
    const game = { phase: "playing" };
    const currentRoom = { code: "12345", revision: 0, game, chat: [] };
    const deps = handlerDeps({ roomRef: { current: currentRoom } });
    const handlers = createSocketHandlers(deps);

    handlers.roomPatch({
      roomCode: "12345",
      type: "chat:append",
      baseRevision: 0,
      revision: 1,
      message: { id: "chat-1", text: "hello" }
    });

    const nextRoom = roomSetterResult(deps, 1, currentRoom);
    expect(nextRoom).toEqual({
      ...currentRoom,
      revision: 1,
      chat: [{ id: "chat-1", text: "hello" }]
    });
    expect(nextRoom.game).toBe(game);
  });

  it("ignores room patches that cannot update the current room before scheduling state", () => {
    const currentRoom = { code: "12345", revision: 2, chat: [] };
    const deps = handlerDeps({ roomRef: { current: currentRoom } });
    const handlers = createSocketHandlers(deps);

    handlers.roomPatch({
      roomCode: "99999",
      type: "chat:append",
      message: { id: "chat-wrong-room" }
    });
    handlers.roomPatch({
      roomCode: "12345",
      type: "unknown",
      revision: 3
    });
    handlers.roomPatch({
      roomCode: "12345",
      type: "chat:append",
      revision: 2,
      message: { id: "chat-stale" }
    });
    handlers.roomPatch({
      roomCode: "12345",
      type: "chat:append",
      baseRevision: 2,
      revision: 3
    });

    expect(deps.setRoom).not.toHaveBeenCalled();
  });

  it("ignores room patches when no current room is available", () => {
    const deps = handlerDeps({ roomRef: { current: null } });
    const handlers = createSocketHandlers(deps);

    handlers.roomPatch({
      roomCode: "12345",
      type: "presence:update",
      baseRevision: 0,
      revision: 1,
      players: []
    });

    expect(deps.setRoom).not.toHaveBeenCalled();
  });

  it("requests a room resume instead of applying a gapped room patch", () => {
    const currentRoom = { code: "12345", revision: 1, chat: [] };
    const deps = handlerDeps({ roomRef: { current: currentRoom } });
    const handlers = createSocketHandlers(deps);
    const requestRoomResume = vi.fn();

    handlers.roomPatch({
      roomCode: "12345",
      type: "chat:append",
      baseRevision: 4,
      revision: 5,
      message: { id: "chat-5", text: "late" }
    }, requestRoomResume);

    expect(requestRoomResume).toHaveBeenCalledOnce();
    expect(deps.setRoom).not.toHaveBeenCalled();
  });

  it("clears remembered player room when an online client receives the finished room update", () => {
    const roomView = { code: "12345", role: "player", game: { phase: "finished" }, players: [] };
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    handlers.roomUpdate(roomView);

    expect(deps.clearLastRoomCode).toHaveBeenCalledOnce();
    expect(roomSetterResult(deps)).toBe(roomView);
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

  it("returns home and clears pending match state when match preload times out", () => {
    const deps = handlerDeps({
      matchSuccessRef: { current: { room: { code: "12345" } } }
    });
    const handlers = createSocketHandlers(deps);

    handlers.matchPreloadTimeout({ roomCode: "12345", message: "一方加载超时，匹配中止" });

    expect(deps.matchSuccessRef.current).toBeNull();
    expect(deps.setMatchStart).toHaveBeenCalledWith(null);
    expect(deps.setMatchSuccess).toHaveBeenCalledWith(null);
    expect(deps.setRoom).toHaveBeenCalledWith(null);
    expect(deps.setView).toHaveBeenCalledWith("home");
    expect(deps.showToast).toHaveBeenCalledWith("一方加载超时，匹配中止");
  });

  it("stores a new incoming duel request and plays the doorbell once", () => {
    const request = { requestId: "duel-1", from: { username: "alice" }, mode: "gomoku" };
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    handlers.duelIncoming(request);

    expect(deps.incomingDuelRef.current).toBe(request);
    expect(deps.setIncomingDuel).toHaveBeenCalledWith(request);
    expect(deps.playDoorbellSound).toHaveBeenCalledWith(deps.audioSettingsRef.current);
  });

  it("ignores duplicate incoming duel requests before scheduling banner or audio work", () => {
    const current = { requestId: "duel-1", from: { username: "alice" }, mode: "gomoku" };
    const deps = handlerDeps({ incomingDuelRef: { current } });
    const handlers = createSocketHandlers(deps);

    handlers.duelIncoming({ requestId: "duel-1", from: { username: "alice" }, mode: "gomoku" });

    expect(deps.incomingDuelRef.current).toBe(current);
    expect(deps.setIncomingDuel).not.toHaveBeenCalled();
    expect(deps.playDoorbellSound).not.toHaveBeenCalled();
  });

  it("clears the incoming duel ref when the matching request closes", () => {
    const current = { requestId: "duel-1", from: { username: "alice" }, mode: "gomoku" };
    const deps = handlerDeps({ incomingDuelRef: { current } });
    const handlers = createSocketHandlers(deps);

    handlers.duelClosed({ requestId: "duel-1" });

    expect(deps.incomingDuelRef.current).toBeNull();
    expect(deps.setIncomingDuel.mock.calls[0][0](current)).toBeNull();
  });

  it("marks a closed finished player room as dismissed so the result modal does not reopen", () => {
    const deps = handlerDeps({
      roomRef: { current: { code: "12345", role: "player", game: { phase: "finished" } } }
    });
    const handlers = createSocketHandlers(deps);

    handlers.roomClosed({ roomCode: "12345", reason: "finished-room-close" });

    expect(deps.setDismissedResultRoom).toHaveBeenCalledWith("12345");
    expect(deps.showToast).not.toHaveBeenCalled();
    expect(deps.setView).toHaveBeenCalledWith("home");
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
    expect(deps.setLobbyStats).toHaveBeenCalledWith({
      onlineCount: 0,
      matchmakingCount: 0,
      matchmakingCounts: { spark: 0, standard: 0, gomoku: 0 }
    });
    expect(deps.closeAllOverlays).toHaveBeenCalledOnce();
    expect(deps.setView).toHaveBeenCalledWith("login");
    expect(deps.showToast).toHaveBeenCalledWith("bye");
  });

  it("stores lobby stats from the socket", () => {
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    handlers.lobbyStats({ onlineCount: 3, matchmakingCount: 2 });

    expect(lobbyStatsSetterResult(deps)).toEqual({
      onlineCount: 3,
      matchmakingCount: 2,
      matchmakingCounts: { spark: 2, standard: 0, gomoku: 0 }
    });
  });

  it("keeps identical lobby stats stable during repeated socket updates", () => {
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);
    const current = {
      onlineCount: 3,
      matchmakingCount: 2,
      matchmakingCounts: { spark: 1, standard: 1, gomoku: 0 }
    };

    handlers.lobbyStats({
      onlineCount: 3,
      matchmakingCount: 2,
      matchmakingCounts: { spark: 1, standard: 1, gomoku: 0 }
    });

    expect(lobbyStatsSetterResult(deps, current)).toBe(current);
  });

  it("normalizes legacy lobby stats state even when visible counts match", () => {
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);
    const current = { onlineCount: 0, matchmakingCount: 0 };

    handlers.lobbyStats({ onlineCount: 0, matchmakingCount: 0 });

    expect(lobbyStatsSetterResult(deps, current)).toEqual({
      onlineCount: 0,
      matchmakingCount: 0,
      matchmakingCounts: { spark: 0, standard: 0, gomoku: 0 }
    });
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

  it("shows readable fallback messages for user-visible socket failures", () => {
    const deps = handlerDeps();
    const handlers = createSocketHandlers(deps);

    handlers.roomClosed({});
    handlers.duelRejected({ username: "alice" });
    handlers.duelUnavailable({ reason: "offline" });
    handlers.accountLoggedOut({});

    expect(deps.showToast).toHaveBeenCalledWith("房间已关闭");
    expect(deps.showToast).toHaveBeenCalledWith("alice拒绝了你的对局申请");
    expect(deps.showToast).toHaveBeenCalledWith("对方不在线。");
    expect(deps.showToast).toHaveBeenCalledWith("账号已在其他地方登录");
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
    expect(socket.on).toHaveBeenCalledWith("room:patch", expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith("match:preload-timeout", expect.any(Function));
    expect(socket.emit).toHaveBeenCalledWith("room:resume", { roomCode: "12345" });
  });

  it("emits a room resume request when an installed patch listener detects a gap", () => {
    const listeners = new Map();
    const socket = {
      on: vi.fn((event, callback) => listeners.set(event, callback)),
      emit: vi.fn()
    };
    const deps = handlerDeps({
      roomRef: { current: { code: "12345", revision: 1, chat: [] } }
    });

    installSocketHandlers(socket, createSocketHandlers(deps), {
      buildRoomResumeRequest: () => ({ roomCode: "12345" })
    });
    listeners.get("room:patch")({
      roomCode: "12345",
      type: "chat:append",
      baseRevision: 4,
      revision: 5,
      message: { id: "chat-5" }
    });

    expect(socket.emit).toHaveBeenCalledWith("room:resume", { roomCode: "12345" });
    expect(deps.setRoom).not.toHaveBeenCalled();
  });

  it("debounces duplicate patch gap resume requests until an authoritative room snapshot arrives", () => {
    let currentTime = 1000;
    const listeners = new Map();
    const socket = {
      on: vi.fn((event, callback) => listeners.set(event, callback)),
      emit: vi.fn()
    };
    const deps = handlerDeps({
      roomRef: { current: { code: "12345", revision: 1, chat: [] } }
    });
    const patch = {
      roomCode: "12345",
      type: "chat:append",
      baseRevision: 4,
      revision: 5,
      message: { id: "chat-5" }
    };

    installSocketHandlers(socket, createSocketHandlers(deps), {
      buildRoomResumeRequest: () => ({ roomCode: "12345" }),
      now: () => currentTime
    });
    listeners.get("room:patch")(patch);
    listeners.get("room:patch")(patch);
    currentTime += ROOM_PATCH_RESUME_DEBOUNCE_MS - 1;
    listeners.get("room:patch")(patch);

    expect(socket.emit).toHaveBeenCalledTimes(1);
    expect(socket.emit).toHaveBeenCalledWith("room:resume", { roomCode: "12345" });

    listeners.get("room:update")({ code: "12345", revision: 5, players: [] });
    listeners.get("room:patch")(patch);

    expect(socket.emit).toHaveBeenCalledTimes(2);
  });

  it("allows another patch gap resume after the debounce window", () => {
    let currentTime = 1000;
    const listeners = new Map();
    const socket = {
      on: vi.fn((event, callback) => listeners.set(event, callback)),
      emit: vi.fn()
    };
    const deps = handlerDeps({
      roomRef: { current: { code: "12345", revision: 1, chat: [] } }
    });
    const patch = {
      roomCode: "12345",
      type: "chat:append",
      baseRevision: 4,
      revision: 5,
      message: { id: "chat-5" }
    };

    installSocketHandlers(socket, createSocketHandlers(deps), {
      buildRoomResumeRequest: () => ({ roomCode: "12345" }),
      now: () => currentTime
    });
    listeners.get("room:patch")(patch);
    currentTime += ROOM_PATCH_RESUME_DEBOUNCE_MS;
    listeners.get("room:patch")(patch);

    expect(socket.emit).toHaveBeenCalledTimes(2);
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
    expect(roomSetterResult(deps)).toEqual(expect.objectContaining({ __audioResumeBaseline: true }));
    expect(socket.emit).toHaveBeenCalledWith("room:resume", { roomCode: "12345" });
  });
});

function roomSetterResult(deps, callNumber = 1, currentRoom = null) {
  const argument = deps.setRoom.mock.calls[callNumber - 1]?.[0];
  return typeof argument === "function" ? argument(currentRoom) : argument;
}

function lobbyStatsSetterResult(deps, currentStats = {}) {
  const argument = deps.setLobbyStats.mock.calls.at(-1)?.[0];
  return typeof argument === "function" ? argument(currentStats) : argument;
}

function matchStartSetterResult(deps, currentMatchStart = null) {
  const argument = deps.setMatchStart.mock.calls.at(-1)?.[0];
  return typeof argument === "function" ? argument(currentMatchStart) : argument;
}

function handlerDeps(overrides = {}) {
  return {
    matchSuccessRef: { current: null },
    incomingDuelRef: { current: null },
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
