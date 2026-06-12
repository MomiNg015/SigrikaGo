import { afterEach, describe, expect, test, vi } from "vitest";
import { GAME_PHASES } from "../src/shared/game.js";
import {
  INITIAL_PASSIVE_SKILL_DELAY_MS,
  createRoomDeadlineScheduler
} from "./roomDeadlineScheduler.js";
import { scheduleRoomTimeout } from "./roomTimers.js";

function testRoom(overrides = {}) {
  return {
    code: "12345",
    openingEndsAt: 2000,
    countingDeadline: null,
    drawDeadline: null,
    timeoutIds: [],
    game: {
      phase: GAME_PHASES.opening,
      scoring: null,
      ...(overrides.game ?? {})
    },
    ...overrides
  };
}

function schedulerFor(rooms, overrides = {}) {
  const calls = {
    opened: [],
    passive: [],
    broadcast: [],
    messages: []
  };
  const scheduler = createRoomDeadlineScheduler({
    rooms,
    scheduleRoomTimeout,
    appendSystem: (room, text) => {
      calls.messages.push(text);
      room.lastMessage = text;
    },
    broadcastRoom: (io, room) => calls.broadcast.push({ io, roomCode: room.code }),
    completeRoomOpening: (room, io) => {
      calls.opened.push({ io, roomCode: room.code });
      room.game.phase = GAME_PHASES.playing;
    },
    startInitialPassiveSkillNow: (room, io) => {
      calls.passive.push({ io, roomCode: room.code });
      return true;
    },
    ...overrides
  });
  return { scheduler, calls };
}

describe("roomDeadlineScheduler", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("schedules room opening from openingEndsAt", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const room = testRoom({ openingEndsAt: 1250 });
    const rooms = new Map([[room.code, room]]);
    const { scheduler, calls } = schedulerFor(rooms);

    scheduler.scheduleGameStart(room, "io");
    vi.advanceTimersByTime(249);

    expect(calls.opened).toEqual([]);

    vi.advanceTimersByTime(1);

    expect(calls.opened).toEqual([{ io: "io", roomCode: room.code }]);
  });

  test("runs initial passive skill only while room is playing", () => {
    vi.useFakeTimers();
    const room = testRoom({ game: { phase: GAME_PHASES.playing } });
    const rooms = new Map([[room.code, room]]);
    const { scheduler, calls } = schedulerFor(rooms);

    scheduler.scheduleInitialPassiveSkill(room, "io");
    vi.advanceTimersByTime(INITIAL_PASSIVE_SKILL_DELAY_MS);

    expect(calls.passive).toEqual([{ io: "io", roomCode: room.code }]);
    expect(calls.broadcast).toEqual([{ io: "io", roomCode: room.code }]);

    const otherRoom = testRoom({ code: "67890", game: { phase: GAME_PHASES.drawRequested } });
    rooms.set(otherRoom.code, otherRoom);
    scheduler.scheduleInitialPassiveSkill(otherRoom, "io");
    vi.advanceTimersByTime(INITIAL_PASSIVE_SKILL_DELAY_MS);

    expect(calls.passive).toHaveLength(1);
  });

  test("expires counting requests back to playing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const room = testRoom({
      countingDeadline: 1100,
      game: {
        phase: GAME_PHASES.countingRequested,
        scoring: { suspendedHiddenHands: [{ id: "p-1" }] },
        points: [{ id: "p-1", hiddenHand: { suspended: true } }]
      }
    });
    const rooms = new Map([[room.code, room]]);
    const { scheduler, calls } = schedulerFor(rooms);

    scheduler.scheduleCountingTimeout(room, "io");
    vi.advanceTimersByTime(100);

    expect(room.game.phase).toBe(GAME_PHASES.playing);
    expect(room.game.scoring).toBeNull();
    expect(room.countingDeadline).toBeNull();
    expect(calls.messages).toEqual(["数子申请超时，视为不同意数子。"]);
    expect(calls.broadcast).toEqual([{ io: "io", roomCode: room.code }]);
  });

  test("expires draw requests back to playing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const room = testRoom({
      drawDeadline: 1100,
      game: {
        phase: GAME_PHASES.drawRequested,
        drawRequest: { by: "black" }
      }
    });
    const rooms = new Map([[room.code, room]]);
    const { scheduler, calls } = schedulerFor(rooms);

    scheduler.scheduleDrawTimeout(room, "io");
    vi.advanceTimersByTime(100);

    expect(room.game.phase).toBe(GAME_PHASES.playing);
    expect(room.game.drawRequest).toBeNull();
    expect(room.drawDeadline).toBeNull();
    expect(calls.messages).toEqual(["和棋申请超时，对局继续。"]);
    expect(calls.broadcast).toEqual([{ io: "io", roomCode: room.code }]);
  });

  test("expires result review back to playing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const room = testRoom({
      game: {
        phase: GAME_PHASES.resultReview,
        scoring: { resultDeadline: 1100 }
      }
    });
    const rooms = new Map([[room.code, room]]);
    const { scheduler, calls } = schedulerFor(rooms);

    scheduler.scheduleResultReviewTimeout(room.code, "io");
    vi.advanceTimersByTime(100);

    expect(room.game.phase).toBe(GAME_PHASES.playing);
    expect(room.game.scoring).toBeNull();
    expect(calls.messages).toEqual(["数子结果确认超时，对局继续。"]);
    expect(calls.broadcast).toEqual([{ io: "io", roomCode: room.code }]);
  });

  test("schedules only pending deadline for the current phase", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const room = testRoom({
      countingDeadline: 1100,
      drawDeadline: 1100,
      game: {
        phase: GAME_PHASES.drawRequested,
        drawRequest: { by: "black" },
        scoring: { resultDeadline: 1100 }
      }
    });
    const rooms = new Map([[room.code, room]]);
    const { scheduler, calls } = schedulerFor(rooms);

    scheduler.schedulePendingRoomDeadlines(room, "io");
    vi.advanceTimersByTime(100);

    expect(calls.messages).toEqual(["和棋申请超时，对局继续。"]);
    expect(room.countingDeadline).toBe(1100);
  });
});
