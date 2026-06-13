import { afterEach, describe, expect, test, vi } from "vitest";
import { COLORS, GAME_PHASES } from "../src/shared/game.js";
import { createRoomClockLifecycle } from "./roomClockLifecycle.js";

describe("room clock lifecycle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("broadcasts lightweight clock updates while the active player still has time", () => {
    const room = playableRoom();
    const scheduled = [];
    const broadcastRoomClock = vi.fn();
    vi.spyOn(Date, "now").mockReturnValue(1000);
    const lifecycle = createLifecycle({
      rooms: new Map([[room.code, room]]),
      scheduleRoomInterval: (targetRoom, callback, delay) => {
        scheduled.push({ targetRoom, callback, delay });
      },
      broadcastRoomClock
    });

    lifecycle.startGameClock(room, {});
    vi.mocked(Date.now).mockReturnValue(2500);
    scheduled[0].callback();

    expect(room.players[0].time.main).toBe(9);
    expect(room.lastTick).toBe(2500);
    expect(broadcastRoomClock).toHaveBeenCalledWith({}, room);
  });

  test("clears the interval when the room has already left memory", () => {
    const room = playableRoom();
    const scheduled = [];
    const clearRoomInterval = vi.fn();
    const lifecycle = createLifecycle({
      rooms: new Map(),
      scheduleRoomInterval: (targetRoom, callback) => {
        scheduled.push({ targetRoom, callback });
      },
      clearRoomInterval
    });

    lifecycle.startGameClock(room, {});
    scheduled[0].callback();

    expect(clearRoomInterval).toHaveBeenCalledWith(room);
  });

  test("hands disconnected games to empty-room close scheduling without ticking clocks", () => {
    const room = playableRoom();
    const scheduled = [];
    const scheduleEmptyActiveRoomClose = vi.fn();
    const broadcastRoomClock = vi.fn();
    const lifecycle = createLifecycle({
      rooms: new Map([[room.code, room]]),
      arePlayersDisconnected: () => true,
      scheduleRoomInterval: (targetRoom, callback) => {
        scheduled.push({ targetRoom, callback });
      },
      scheduleEmptyActiveRoomClose,
      broadcastRoomClock
    });

    lifecycle.startGameClock(room, {});
    scheduled[0].callback();

    expect(room.players[0].time.main).toBe(10);
    expect(scheduleEmptyActiveRoomClose).toHaveBeenCalledWith(room, {});
    expect(broadcastRoomClock).not.toHaveBeenCalled();
  });

  test("finishes the room and broadcasts a full update when the active player times out", () => {
    const room = playableRoom({ main: 1, periods: 0 });
    const scheduled = [];
    const appendSystem = vi.fn();
    const scheduleRoomClose = vi.fn();
    const broadcastRoom = vi.fn();
    vi.spyOn(Date, "now").mockReturnValue(1000);
    const lifecycle = createLifecycle({
      rooms: new Map([[room.code, room]]),
      scheduleRoomInterval: (targetRoom, callback) => {
        scheduled.push({ targetRoom, callback });
      },
      appendSystem,
      scheduleRoomClose,
      broadcastRoom
    });

    lifecycle.startGameClock(room, {});
    vi.mocked(Date.now).mockReturnValue(3000);
    scheduled[0].callback();

    expect(room.game.phase).toBe(GAME_PHASES.finished);
    expect(room.game.winner).toBeTruthy();
    expect(appendSystem).toHaveBeenCalledWith(room, expect.stringContaining("超时"));
    expect(scheduleRoomClose).toHaveBeenCalledWith(room.code, {});
    expect(broadcastRoom).toHaveBeenCalledWith({}, room);
  });
});

function createLifecycle(overrides = {}) {
  return createRoomClockLifecycle({
    rooms: new Map(),
    scheduleRoomInterval: vi.fn(),
    clearRoomInterval: vi.fn(),
    arePlayersDisconnected: () => false,
    scheduleEmptyActiveRoomClose: vi.fn(),
    broadcastRoomClock: vi.fn(),
    broadcastRoom: vi.fn(),
    broadcastToast: vi.fn(),
    appendSystem: vi.fn(),
    scheduleRoomClose: vi.fn(),
    ...overrides
  });
}

function playableRoom(timeOverrides = {}) {
  return {
    code: "12345",
    lastTick: 0,
    game: {
      phase: GAME_PHASES.playing,
      turn: COLORS.black,
      history: [],
      moveNumber: 1
    },
    players: [
      {
        color: COLORS.black,
        user: { username: "black" },
        time: {
          main: 10,
          periods: 1,
          periodRemaining: 30,
          byoYomi: 30,
          ...timeOverrides
        }
      },
      {
        color: COLORS.white,
        user: { username: "white" },
        time: {
          main: 10,
          periods: 1,
          periodRemaining: 30,
          byoYomi: 30
        }
      }
    ]
  };
}
