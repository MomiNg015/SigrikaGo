import { afterEach, describe, expect, test, vi } from "vitest";
import { GAME_PHASES } from "../src/shared/game.js";
import {
  EMPTY_ACTIVE_ROOM_CLOSE_MS,
  INVALID_ROOM_CLOSE_DELAY_MS,
  ROOM_CLOSE_DELAY_MS,
  ROOM_RECORD_SAVE_RETRY_MS,
  createRoomCloseLifecycle,
  roomCloseDelay
} from "./roomCloseLifecycle.js";
import {
  clearRoomTimeout,
  scheduleRoomTimeout
} from "./roomTimers.js";

function testRoom(overrides = {}) {
  return {
    code: "12345",
    recordSaved: true,
    closesAt: null,
    emptySince: null,
    emptyTimerId: null,
    timeoutIds: [],
    players: [],
    spectators: [],
    chat: [],
    game: {
      phase: GAME_PHASES.finished,
      winner: { winnerColor: "black", invalid: false },
      moveNumber: 12,
      ...(overrides.game ?? {})
    },
    ...overrides
  };
}

function lifecycleFor(rooms, overrides = {}) {
  const calls = {
    cleared: [],
    closed: [],
    deleted: [],
    persisted: [],
    saved: [],
    prepared: [],
    unregistered: [],
    messages: [],
    saveErrors: [],
    deleteErrors: []
  };
  const lifecycle = createRoomCloseLifecycle({
    rooms,
    clearRoomTimers: (room) => {
      calls.cleared.push(room.code);
      room.timeoutIds = [];
    },
    scheduleRoomTimeout,
    clearRoomTimeout,
    hasConnectedRoomParticipant: () => false,
    arePlayersDisconnected: () => false,
    emitRoomClosed: (io, room, payload) => calls.closed.push({ io, roomCode: room.code, payload }),
    deletePersistedRoom: (roomCode) => {
      calls.deleted.push(roomCode);
      return Promise.resolve();
    },
    persistRoom: (room, options) => calls.persisted.push({ roomCode: room.code, options }),
    appendSystem: (room, text) => {
      calls.messages.push(text);
      room.chat.push({ type: "system", text });
    },
    saveGameRecord: (room) => {
      calls.saved.push(room.code);
      room.recordSaved = true;
      return Promise.resolve();
    },
    prepareCloseState: (room) => calls.prepared.push(room.code),
    unregisterRoom: (room) => calls.unregistered.push(room.code),
    onSaveError: (error) => calls.saveErrors.push(error),
    onDeleteError: (error) => calls.deleteErrors.push(error),
    ...overrides
  });
  return { lifecycle, calls };
}

describe("roomCloseLifecycle", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("uses shorter close delay for invalid finished rooms", () => {
    expect(roomCloseDelay(testRoom())).toBe(ROOM_CLOSE_DELAY_MS);
    expect(roomCloseDelay(testRoom({ game: { winner: { invalid: true } } }))).toBe(INVALID_ROOM_CLOSE_DELAY_MS);
  });

  test("schedules finished room closure and saves unsaved records once", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const room = testRoom({ recordSaved: false });
    const rooms = new Map([[room.code, room]]);
    const { lifecycle, calls } = lifecycleFor(rooms);

    lifecycle.scheduleRoomClose(room.code, "io");
    await Promise.resolve();

    expect(calls.prepared).toEqual([room.code]);
    expect(calls.saved).toEqual([room.code]);
    expect(room.closesAt).toBe(1000 + ROOM_CLOSE_DELAY_MS);
    expect(calls.persisted).toEqual([{ roomCode: room.code, options: { force: true } }]);

    vi.advanceTimersByTime(ROOM_CLOSE_DELAY_MS);
    await Promise.resolve();

    expect(calls.closed[0]).toEqual({
      io: "io",
      roomCode: room.code,
      payload: { reason: "finished-room-close", roomCode: room.code }
    });
    expect(calls.unregistered).toEqual([room.code]);
    expect(calls.deleted).toEqual([room.code]);
    expect(rooms.has(room.code)).toBe(false);
  });

  test("keeps valid finished rooms open until the result record is saved", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const saveError = new Error("db unavailable");
    const metrics = { increment: vi.fn() };
    const room = testRoom({ recordSaved: false });
    const rooms = new Map([[room.code, room]]);
    const { lifecycle, calls } = lifecycleFor(rooms, {
      metrics,
      saveGameRecord: vi.fn()
        .mockRejectedValueOnce(saveError)
        .mockImplementationOnce(async (roomToSave) => {
          roomToSave.recordSaved = true;
        })
    });

    lifecycle.scheduleRoomClose(room.code, "io");
    await Promise.resolve();
    await Promise.resolve();

    expect(calls.saveErrors).toEqual([saveError]);
    expect(metrics.increment).toHaveBeenCalledWith("roomResultSaveErrors");

    vi.advanceTimersByTime(ROOM_CLOSE_DELAY_MS);
    await Promise.resolve();

    expect(rooms.has(room.code)).toBe(true);
    expect(calls.closed).toEqual([]);
    expect(calls.deleted).toEqual([]);
    expect(room.closesAt).toBe(1000 + ROOM_CLOSE_DELAY_MS + ROOM_RECORD_SAVE_RETRY_MS);

    vi.advanceTimersByTime(ROOM_RECORD_SAVE_RETRY_MS);
    await Promise.resolve();

    expect(calls.closed).toHaveLength(1);
    expect(calls.deleted).toEqual([room.code]);
    expect(rooms.has(room.code)).toBe(false);
  });

  test("extends valid finished room closure while participants remain connected", () => {
    vi.useFakeTimers();
    vi.setSystemTime(2000);
    const room = testRoom();
    const rooms = new Map([[room.code, room]]);
    const connected = vi.fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    const { lifecycle, calls } = lifecycleFor(rooms, {
      hasConnectedRoomParticipant: connected
    });

    lifecycle.scheduleRoomClose(room.code, "io");
    vi.advanceTimersByTime(ROOM_CLOSE_DELAY_MS);

    expect(rooms.has(room.code)).toBe(true);
    expect(calls.closed).toEqual([]);
    expect(calls.persisted).toHaveLength(3);

    vi.advanceTimersByTime(ROOM_CLOSE_DELAY_MS);

    expect(calls.closed).toHaveLength(1);
    expect(rooms.has(room.code)).toBe(false);
  });

  test("marks empty active rooms invalid before closing them", () => {
    vi.useFakeTimers();
    vi.setSystemTime(5000);
    const room = testRoom({
      game: { phase: GAME_PHASES.playing, winner: null, moveNumber: 3 },
      players: [{ socketId: null }, { socketId: null }]
    });
    const rooms = new Map([[room.code, room]]);
    const { lifecycle, calls } = lifecycleFor(rooms, {
      arePlayersDisconnected: () => true
    });

    lifecycle.scheduleEmptyActiveRoomClose(room, "io");

    expect(room.emptySince).toBe(5000);
    expect(room.emptyTimerId).toBeTruthy();
    expect(calls.persisted).toEqual([{ roomCode: room.code, options: { force: true } }]);

    vi.advanceTimersByTime(EMPTY_ACTIVE_ROOM_CLOSE_MS);

    expect(room.game.phase).toBe(GAME_PHASES.finished);
    expect(room.game.winner).toMatchObject({
      reason: "empty-room",
      invalid: true,
      invalidReason: "empty-room"
    });
    expect(room.recordSaved).toBe(true);
    expect(calls.messages).toEqual(["双方离开房间超过5分钟，对局无效。"]);
    expect(calls.unregistered).toEqual([room.code]);
    expect(calls.deleted).toEqual([room.code]);
    expect(rooms.has(room.code)).toBe(false);
  });

  test("clears pending empty-room closure when players reconnect", () => {
    vi.useFakeTimers();
    const room = testRoom({
      game: { phase: GAME_PHASES.playing },
      emptySince: 1000
    });
    const callback = vi.fn();
    const timeoutId = scheduleRoomTimeout(room, callback, 1000);
    room.emptyTimerId = timeoutId;
    const rooms = new Map([[room.code, room]]);
    const { lifecycle } = lifecycleFor(rooms, {
      arePlayersDisconnected: () => false
    });

    lifecycle.scheduleEmptyActiveRoomClose(room, "io");
    vi.advanceTimersByTime(1000);

    expect(callback).not.toHaveBeenCalled();
    expect(room.emptySince).toBeNull();
    expect(room.emptyTimerId).toBeNull();
    expect(room.timeoutIds).toEqual([]);
  });
});
