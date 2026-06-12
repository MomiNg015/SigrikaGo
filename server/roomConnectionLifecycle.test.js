import { describe, expect, test, vi } from "vitest";
import { GAME_PHASES } from "../src/shared/game.js";
import { createRoomConnectionLifecycle } from "./roomConnectionLifecycle.js";

describe("room connection lifecycle", () => {
  test("reconnects disconnected players and clears empty-room close state", () => {
    const room = testRoom({
      players: [player("alice", { socketId: null, disconnectedAt: 1000 })]
    });
    const appendSystem = vi.fn();
    const clearEmptyRoomClose = vi.fn();
    const persistRoom = vi.fn();
    const socket = { id: "socket-new", join: vi.fn() };
    const lifecycle = createLifecycle({
      rooms: new Map([[room.code, room]]),
      appendSystem,
      clearEmptyRoomClose,
      persistRoom
    });

    expect(lifecycle.attachSocketToRoom(room.code, socket, room.players[0].user)).toBe(room);
    expect(room.players[0]).toMatchObject({ socketId: "socket-new", disconnectedAt: null });
    expect(clearEmptyRoomClose).toHaveBeenCalledWith(room);
    expect(appendSystem).toHaveBeenCalledWith(room, expect.stringContaining("已重新连接"), { kind: "reconnect" });
    expect(socket.join).toHaveBeenCalledWith(room.code);
    expect(persistRoom).toHaveBeenCalledWith(room, { force: true });
  });

  test("adds first-time spectators without duplicating existing spectators", () => {
    const watcher = user("watcher");
    const room = testRoom();
    const appendSystem = vi.fn();
    const persistRoom = vi.fn();
    const lifecycle = createLifecycle({
      rooms: new Map([[room.code, room]]),
      appendSystem,
      persistRoom
    });

    expect(lifecycle.attachSocketToRoom(room.code, { id: "socket-watch", join: vi.fn() }, watcher)).toBe(room);
    expect(lifecycle.attachSocketToRoom(room.code, { id: "socket-watch-2", join: vi.fn() }, watcher)).toBe(room);

    expect(room.spectators).toEqual([{ user: watcher, socketId: "socket-watch" }]);
    expect(appendSystem).toHaveBeenCalledTimes(1);
  });

  test("detaches player and spectator sockets, schedules empty-room close, and persists changed rooms", () => {
    const room = testRoom({
      players: [player("alice", { socketId: "socket-a" })],
      spectators: [{ user: user("watcher"), socketId: "socket-watch" }]
    });
    const matchmakingQueue = { removeSocket: vi.fn() };
    const appendSystem = vi.fn();
    const scheduleEmptyActiveRoomClose = vi.fn();
    const persistRoom = vi.fn();
    const lifecycle = createLifecycle({
      rooms: new Map([[room.code, room]]),
      matchmakingQueue,
      appendSystem,
      scheduleEmptyActiveRoomClose,
      persistRoom,
      now: () => 5000
    });

    expect(lifecycle.detachSocket("socket-a", "io")).toEqual([room]);
    expect(matchmakingQueue.removeSocket).toHaveBeenCalledWith("socket-a");
    expect(room.players[0]).toMatchObject({ socketId: null, disconnectedAt: 5000 });
    expect(appendSystem).toHaveBeenCalledWith(room, expect.stringContaining("断线中"), { kind: "disconnect" });
    expect(scheduleEmptyActiveRoomClose).toHaveBeenCalledWith(room, "io");
    expect(persistRoom).toHaveBeenCalledWith(room, { force: true });

    expect(lifecycle.detachSocket("socket-watch", "io")).toEqual([room]);
    expect(room.spectators).toEqual([]);
  });

  test("does not add disconnect notices for finished player sockets", () => {
    const room = testRoom({
      game: { phase: GAME_PHASES.finished },
      players: [player("alice", { socketId: "socket-a" })]
    });
    const appendSystem = vi.fn();
    const lifecycle = createLifecycle({
      rooms: new Map([[room.code, room]]),
      appendSystem
    });

    expect(lifecycle.detachSocket("socket-a")).toEqual([room]);
    expect(appendSystem).not.toHaveBeenCalled();
  });

  test("removes spectators and finished players through explicit leave", () => {
    const finishedPlayer = player("alice", { socketId: "socket-a", disconnectedAt: 1000 });
    const spectator = { user: user("watcher"), socketId: "socket-watch" };
    const room = testRoom({
      game: { phase: GAME_PHASES.finished },
      players: [finishedPlayer],
      spectators: [spectator]
    });
    const appendSystem = vi.fn();
    const persistRoom = vi.fn();
    const lifecycle = createLifecycle({
      rooms: new Map([[room.code, room]]),
      appendSystem,
      persistRoom
    });

    expect(lifecycle.leaveRoom(room.code, "alice", "socket-a")).toBe(room);
    expect(finishedPlayer).toMatchObject({ socketId: null, disconnectedAt: null });

    expect(lifecycle.leaveRoom(room.code, "watcher", "socket-watch")).toBe(room);
    expect(room.spectators).toEqual([]);
    expect(appendSystem).toHaveBeenCalledTimes(2);
    expect(appendSystem).toHaveBeenLastCalledWith(room, expect.stringContaining("离开了观战席"), { kind: "spectator-leave" });
    expect(persistRoom).toHaveBeenCalledTimes(2);
  });
});

function createLifecycle(overrides = {}) {
  return createRoomConnectionLifecycle({
    rooms: new Map(),
    matchmakingQueue: { removeSocket: vi.fn() },
    validateRoomCode: (roomCode) => ({ ok: true, value: roomCode }),
    appendSystem: vi.fn(),
    clearEmptyRoomClose: vi.fn(),
    scheduleEmptyActiveRoomClose: vi.fn(),
    persistRoom: vi.fn(),
    now: () => 1000,
    ...overrides
  });
}

function testRoom(overrides = {}) {
  return {
    code: "12345",
    game: { phase: GAME_PHASES.playing },
    players: [player("black", { socketId: "socket-black" })],
    spectators: [],
    ...overrides
  };
}

function player(id, overrides = {}) {
  return {
    color: id,
    user: user(id),
    socketId: `${id}-socket`,
    disconnectedAt: null,
    ...overrides
  };
}

function user(id) {
  return {
    id,
    username: id
  };
}
