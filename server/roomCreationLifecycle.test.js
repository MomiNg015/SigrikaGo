import { describe, expect, test, vi } from "vitest";
import { createRoomCreationLifecycle } from "./roomCreationLifecycle.js";

function user(id, overrides = {}) {
  return {
    id,
    username: id,
    rank: "Rookie",
    rating: 1000,
    wins: 0,
    losses: 0,
    selectedCharacter: "sigrika",
    characterConfig: null,
    ...overrides
  };
}

function queuedPlayer(id, socketId, mode = "spark") {
  return {
    user: user(id),
    socketId,
    mode
  };
}

function fakeIo() {
  const io = {
    messages: [],
    to(socketId) {
      return {
        emit: (event, payload) => {
          io.messages.push({ socketId, event, payload });
        }
      };
    }
  };
  return io;
}

function createLifecycle(overrides = {}) {
  const rooms = overrides.rooms ?? new Map();
  const matchmakingQueue = overrides.matchmakingQueue ?? {
    join: vi.fn(() => ({ matched: false })),
    removeUser: vi.fn()
  };
  const deps = {
    rooms,
    matchmakingQueue,
    isRoomCodeTaken: vi.fn((code) => rooms.has(code)),
    persistRoom: vi.fn(),
    registerRoom: vi.fn(),
    startGameClock: vi.fn(),
    scheduleRoomPreloadTimeout: vi.fn(),
    roomView: vi.fn((room, viewerId) => ({ code: room.code, viewerId })),
    appendSystem: vi.fn(),
    broadcastRoom: vi.fn(),
    ...overrides
  };

  return {
    lifecycle: createRoomCreationLifecycle(deps),
    deps
  };
}

describe("room creation lifecycle", () => {
  test("keeps unmatched matchmaking joins queued without creating a room", () => {
    const player = queuedPlayer("alice", "socket-a");
    const { lifecycle, deps } = createLifecycle({
      matchmakingQueue: {
        join: vi.fn(() => ({ matched: false })),
        removeUser: vi.fn()
      }
    });

    expect(lifecycle.joinMatchmaking(player, fakeIo())).toBeNull();
    expect(deps.rooms.size).toBe(0);
    expect(deps.persistRoom).not.toHaveBeenCalled();
    expect(deps.registerRoom).not.toHaveBeenCalled();
    expect(deps.startGameClock).not.toHaveBeenCalled();
    expect(deps.scheduleRoomPreloadTimeout).not.toHaveBeenCalled();
    expect(deps.broadcastRoom).not.toHaveBeenCalled();
  });

  test("registers matched matchmaking rooms and notifies both players", () => {
    const opponent = queuedPlayer("alice", "socket-a");
    const player = queuedPlayer("bob", "socket-b");
    const io = fakeIo();
    const { lifecycle, deps } = createLifecycle({
      matchmakingQueue: {
        join: vi.fn(() => ({ matched: true, opponent, player, mode: "spark" })),
        removeUser: vi.fn()
      }
    });

    const room = lifecycle.joinMatchmaking(player, io, { canPair: () => true });

    expect(room).toBeTruthy();
    expect(room).toMatchObject({ rated: true, matchSource: "matchmaking" });
    expect(deps.rooms.get(room.code)).toBe(room);
    expect(deps.registerRoom).toHaveBeenCalledWith(room);
    expect(deps.persistRoom).toHaveBeenCalledWith(room, { force: true });
    expect(deps.startGameClock).toHaveBeenCalledWith(room, io);
    expect(deps.scheduleRoomPreloadTimeout).toHaveBeenCalledWith(room, io);
    expect(deps.appendSystem).toHaveBeenCalledWith(room, expect.stringContaining("3"));
    expect(deps.broadcastRoom).toHaveBeenCalledWith(io, room);
    expect(io.messages).toEqual([
      { socketId: "socket-a", event: "match:found", payload: { code: room.code, viewerId: "alice" } },
      { socketId: "socket-b", event: "match:found", payload: { code: room.code, viewerId: "bob" } }
    ]);
  });

  test("creates direct rooms, clears both queued users, and normalizes the mode", () => {
    const first = queuedPlayer("alice", "socket-a");
    const second = queuedPlayer("bob", "socket-b");
    const io = fakeIo();
    const matchmakingQueue = {
      join: vi.fn(),
      removeUser: vi.fn()
    };
    const { lifecycle, deps } = createLifecycle({ matchmakingQueue });

    const room = lifecycle.createDirectRoom(first, second, io, "standard");

    expect(room.mode).toBe("standard");
    expect(room).toMatchObject({ rated: false, matchSource: "duel" });
    expect(room.game.mode).toBe("standard");
    expect(matchmakingQueue.removeUser).toHaveBeenCalledWith("alice");
    expect(matchmakingQueue.removeUser).toHaveBeenCalledWith("bob");
    expect(deps.rooms.get(room.code)).toBe(room);
    expect(deps.registerRoom).toHaveBeenCalledWith(room);
    expect(deps.persistRoom).toHaveBeenCalledWith(room, { force: true });
    expect(deps.startGameClock).toHaveBeenCalledWith(room, io);
    expect(deps.scheduleRoomPreloadTimeout).toHaveBeenCalledWith(room, io);
    expect(deps.appendSystem).toHaveBeenCalledWith(room, expect.stringContaining("3"));
    expect(deps.broadcastRoom).toHaveBeenCalledWith(io, room);
    expect(io.messages.map((message) => [message.socketId, message.event])).toEqual([
      ["socket-a", "match:found"],
      ["socket-b", "match:found"]
    ]);
  });

  test("announces gomoku room mode and automatic color assignment", () => {
    const first = queuedPlayer("alice", "socket-a");
    const second = queuedPlayer("bob", "socket-b");
    const io = fakeIo();
    const { lifecycle, deps } = createLifecycle();

    const room = lifecycle.createDirectRoom(first, second, io, "gomoku");

    expect(room.mode).toBe("gomoku");
    expect(room.game.mode).toBe("gomoku");
    expect(deps.appendSystem).toHaveBeenCalledWith(room, expect.stringContaining("五子棋"));
    expect(deps.appendSystem).toHaveBeenCalledWith(room, expect.stringContaining("自动猜先"));
    expect(deps.appendSystem).toHaveBeenCalledWith(room, expect.stringContaining("执黑先行"));
  });
});
