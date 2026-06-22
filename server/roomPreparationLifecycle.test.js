import { afterEach, describe, expect, test, vi } from "vitest";
import { GAME_PHASES } from "../src/shared/game.js";
import {
  MATCH_PRELOAD_TIMEOUT_MESSAGE,
  createRoomPreparationLifecycle
} from "./roomPreparationLifecycle.js";
import { scheduleRoomTimeout } from "./roomTimers.js";

function player(id, socketId) {
  return { user: { id, username: id }, socketId };
}

function room(overrides = {}) {
  return {
    code: "12345",
    players: [player("alice", "socket-a"), player("bob", "socket-b")],
    spectators: [],
    timeoutIds: [],
    openingEndsAt: null,
    preload: {
      startedAt: 1000,
      deadlineAt: 61000,
      readyUserIds: [],
      readyCount: 0,
      requiredCount: 2
    },
    game: { phase: GAME_PHASES.preloading },
    ...overrides
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

function lifecycleFor(rooms, overrides = {}) {
  const calls = {
    broadcast: [],
    deleted: [],
    messages: [],
    scheduledGameStart: [],
    unregistered: []
  };
  const lifecycle = createRoomPreparationLifecycle({
    rooms,
    clearRoomTimers: (candidate) => {
      for (const id of candidate.timeoutIds ?? []) clearTimeout(id);
      candidate.timeoutIds = [];
    },
    deletePersistedRoom: (roomCode) => calls.deleted.push(roomCode),
    unregisterRoom: (roomCode) => calls.unregistered.push(roomCode),
    scheduleRoomTimeout,
    appendSystem: (_room, text) => calls.messages.push(text),
    broadcastRoom: (io, candidate) => calls.broadcast.push({ io, roomCode: candidate.code, phase: candidate.game.phase }),
    scheduleGameStart: (candidate, io) => calls.scheduledGameStart.push({ io, roomCode: candidate.code }),
    now: () => 1000,
    ...overrides
  });
  return { calls, lifecycle };
}

describe("room preparation lifecycle", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("broadcasts ready counts until both players have loaded", () => {
    const currentRoom = room();
    const rooms = new Map([[currentRoom.code, currentRoom]]);
    const io = fakeIo();
    const { calls, lifecycle } = lifecycleFor(rooms);

    lifecycle.markRoomPreloadReady(currentRoom.code, "alice", io);

    expect(currentRoom.preload.readyCount).toBe(1);
    expect(calls.broadcast).toEqual([{ io, roomCode: "12345", phase: GAME_PHASES.preloading }]);
    expect(calls.scheduledGameStart).toEqual([]);

    lifecycle.markRoomPreloadReady(currentRoom.code, "bob", io);

    expect(currentRoom.game.phase).toBe(GAME_PHASES.opening);
    expect(currentRoom.preload.readyCount).toBe(2);
    expect(currentRoom.openingEndsAt).toBe(4000);
    expect(calls.scheduledGameStart).toEqual([{ io, roomCode: "12345" }]);
  });

  test("aborts the match when not every player is ready before the deadline", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const currentRoom = room();
    const rooms = new Map([[currentRoom.code, currentRoom]]);
    const io = fakeIo();
    const { calls, lifecycle } = lifecycleFor(rooms);

    lifecycle.scheduleRoomPreloadTimeout(currentRoom, io);
    vi.advanceTimersByTime(60000);

    expect(rooms.has(currentRoom.code)).toBe(false);
    expect(calls.unregistered).toEqual(["12345"]);
    expect(calls.deleted).toEqual(["12345"]);
    expect(io.messages).toEqual([
      {
        socketId: "socket-a",
        event: "match:preload-timeout",
        payload: { roomCode: "12345", message: MATCH_PRELOAD_TIMEOUT_MESSAGE }
      },
      {
        socketId: "socket-b",
        event: "match:preload-timeout",
        payload: { roomCode: "12345", message: MATCH_PRELOAD_TIMEOUT_MESSAGE }
      }
    ]);
  });
});
