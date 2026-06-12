import { describe, expect, test, vi } from "vitest";
import { GAME_PHASES } from "../src/shared/game.js";
import { createRoomRequestLifecycle } from "./roomRequestLifecycle.js";

describe("room request lifecycle", () => {
  test("returns room-code validation errors before reading rooms", () => {
    const lifecycle = createLifecycle({
      validateRoomCode: () => ({ ok: false, error: "bad room code" })
    });

    expect(lifecycle.requestCounting("bad", "alice", "io")).toEqual({
      ok: false,
      error: "bad room code"
    });
  });

  test("starts counting requests for playing room players", () => {
    const room = testRoom();
    const appendSystem = vi.fn();
    const scheduleCountingTimeout = vi.fn();
    const lifecycle = createLifecycle({
      rooms: new Map([[room.code, room]]),
      appendSystem,
      scheduleCountingTimeout
    });

    const result = lifecycle.requestCounting(room.code, "black", "io");

    expect(result).toMatchObject({ ok: true, room });
    expect(room.game.phase).toBe(GAME_PHASES.countingRequested);
    expect(room.game.scoring.requestedBy).toBe("black");
    expect(scheduleCountingTimeout).toHaveBeenCalledWith(room, "io");
    expect(appendSystem).toHaveBeenCalledWith(room, expect.stringContaining("black"));
  });

  test("rejects draw responses when the room is not waiting for a draw response", () => {
    const room = testRoom({ game: { phase: GAME_PHASES.playing } });
    const lifecycle = createLifecycle({
      rooms: new Map([[room.code, room]])
    });

    expect(lifecycle.respondDraw(room.code, "white", true, "io")).toMatchObject({
      ok: false,
      error: "当前没有和棋申请"
    });
  });

  test("accepts draw responses and schedules room close", () => {
    const room = testRoom({
      game: {
        phase: GAME_PHASES.drawRequested,
        drawRequest: { requestedBy: "black", requestedColor: "black" },
        history: Array.from({ length: 20 }, (_, index) => ({ type: "move", id: `${index}` }))
      }
    });
    const appendSystem = vi.fn();
    const scheduleRoomClose = vi.fn();
    const lifecycle = createLifecycle({
      rooms: new Map([[room.code, room]]),
      appendSystem,
      scheduleRoomClose
    });

    const result = lifecycle.respondDraw(room.code, "white", true, "io");

    expect(result).toMatchObject({ ok: true, room });
    expect(room.game.phase).toBe(GAME_PHASES.finished);
    expect(room.game.winner).toBeTruthy();
    expect(scheduleRoomClose).toHaveBeenCalledWith(room.code, "io");
    expect(appendSystem).toHaveBeenCalledWith(room, expect.any(String));
  });

  test("validates scoring action points before phase-specific scoring checks", () => {
    const room = testRoom({
      game: {
        phase: GAME_PHASES.markingDead,
        size: 19,
        scoring: { confirmedBy: [] }
      }
    });
    const validateActionPoint = vi.fn(() => "bad point");
    const lifecycle = createLifecycle({
      rooms: new Map([[room.code, room]]),
      validateActionPoint
    });

    expect(lifecycle.handleScoringAction(room.code, "black", { type: "mark-dead", pointId: "bad" }, "io"))
      .toEqual({ ok: false, error: "bad point" });
    expect(validateActionPoint).toHaveBeenCalledWith({ type: "mark-dead", pointId: "bad" }, 19);
  });

  test("routes scoring actions to result review only during result review", () => {
    const room = testRoom({
      game: { phase: GAME_PHASES.markingDead }
    });
    const lifecycle = createLifecycle({
      rooms: new Map([[room.code, room]])
    });

    expect(lifecycle.handleScoringAction(room.code, "black", { type: "accept-result" }, "io"))
      .toMatchObject({ ok: false, error: "当前不在结果确认阶段" });
  });
});

function createLifecycle(overrides = {}) {
  return createRoomRequestLifecycle({
    rooms: new Map(),
    validateRoomCode: (roomCode) => ({ ok: true, value: roomCode }),
    validateActionPoint: () => null,
    appendSystem: vi.fn(),
    appendNotices: vi.fn(),
    broadcastToast: vi.fn(),
    scheduleCountingTimeout: vi.fn(),
    scheduleDrawTimeout: vi.fn(),
    scheduleResultReviewTimeout: vi.fn(),
    scheduleRoomClose: vi.fn(),
    ...overrides
  });
}

function testRoom(overrides = {}) {
  return {
    code: "12345",
    players: [player("black"), player("white")],
    game: {
      phase: GAME_PHASES.playing,
      size: 19,
      history: [],
      board: [],
      points: [],
      scoring: null,
      ...overrides.game
    },
    ...overrides
  };
}

function player(id) {
  return {
    color: id,
    user: {
      id,
      username: id
    }
  };
}
