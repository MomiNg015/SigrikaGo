import { describe, expect, test, vi } from "vitest";
import { GAME_PHASES } from "../src/shared/game.js";
import { createRoomActionLifecycle } from "./roomActionLifecycle.js";

function testRoom(overrides = {}) {
  return {
    code: "12345",
    players: [
      { user: { id: "black", username: "Black" }, color: "black" },
      { user: { id: "white", username: "White" }, color: "white" }
    ],
    game: {
      size: 13,
      moveNumber: 1,
      phase: GAME_PHASES.playing,
      pendingSkill: null,
      ...overrides.game
    },
    ...overrides
  };
}

function createLifecycle(overrides = {}) {
  const room = overrides.room ?? testRoom();
  const rooms = overrides.rooms ?? new Map([[room.code, room]]);
  const deps = {
    rooms,
    validateRoomCode: vi.fn((code) => ({ ok: true, value: code })),
    validateActionPoint: vi.fn(() => null),
    appendSystem: vi.fn(),
    appendNotices: vi.fn(),
    startActiveSkill: vi.fn(() => ({ ok: true, skill: true })),
    broadcastToast: vi.fn(),
    resetByoYomi: vi.fn(),
    scheduleRoomClose: vi.fn(),
    maybeStartPassiveSkill: vi.fn(),
    isRoomTestAction: vi.fn(() => false),
    handleRoomTestAction: vi.fn(),
    applyStandardGameAction: vi.fn(() => ({ ok: true, standard: true })),
    ...overrides
  };

  return {
    lifecycle: createRoomActionLifecycle(deps),
    deps,
    room
  };
}

describe("room action lifecycle", () => {
  test("returns room-code validation errors before room lookup", () => {
    const { lifecycle, deps } = createLifecycle({
      rooms: new Map(),
      validateRoomCode: vi.fn(() => ({ ok: false, error: "bad room code" }))
    });

    expect(lifecycle.handleGameAction("bad", "black", { type: "move" }, "io")).toEqual({
      ok: false,
      error: "bad room code"
    });
    expect(deps.validateActionPoint).not.toHaveBeenCalled();
  });

  test("validates action points before player lookup", () => {
    const { lifecycle, deps, room } = createLifecycle({
      validateActionPoint: vi.fn(() => "bad point")
    });

    expect(lifecycle.handleGameAction(room.code, "spectator", { type: "move", pointId: "bad" }, "io")).toEqual({
      ok: false,
      error: "bad point"
    });
    expect(deps.validateActionPoint).toHaveBeenCalledWith({ type: "move", pointId: "bad" }, 13);
    expect(deps.applyStandardGameAction).not.toHaveBeenCalled();
  });

  test("dispatches test actions and applies returned game state", () => {
    const nextGame = { size: 13, moveNumber: 2 };
    const { lifecycle, deps, room } = createLifecycle({
      isRoomTestAction: vi.fn(() => true),
      handleRoomTestAction: vi.fn(() => ({
        ok: true,
        systemMessage: "test notice",
        result: { ok: true, state: nextGame, notices: ["notice"] }
      }))
    });

    expect(lifecycle.handleGameAction(room.code, "black", { type: "test" }, "io")).toEqual({
      ok: true,
      room
    });
    expect(room.game).toBe(nextGame);
    expect(deps.appendSystem).toHaveBeenCalledWith(room, "test notice");
    expect(deps.appendNotices).toHaveBeenCalledWith(room, ["notice"]);
  });

  test("dispatches skill actions to the skill lifecycle", () => {
    const action = { type: "skill", targetId: "p-1" };
    const { lifecycle, deps, room } = createLifecycle();

    expect(lifecycle.handleGameAction(room.code, "black", action, "io")).toEqual({ ok: true, skill: true });
    expect(deps.startActiveSkill).toHaveBeenCalledWith({
      room,
      player: room.players[0],
      action,
      io: "io"
    });
    expect(deps.applyStandardGameAction).not.toHaveBeenCalled();
  });

  test("blocks standard board actions outside the playing phase", () => {
    const action = { type: "move", pointId: "aa" };
    const { lifecycle, deps, room } = createLifecycle({
      room: testRoom({ game: { phase: GAME_PHASES.opening } })
    });

    expect(lifecycle.handleGameAction(room.code, "black", action, "io")).toEqual({
      ok: false,
      error: "当前阶段不能执行该操作"
    });
    expect(deps.applyStandardGameAction).not.toHaveBeenCalled();
  });

  test("blocks active skills outside the playing phase before skill resolution", () => {
    const action = { type: "skill", targetId: "p-1" };
    const { lifecycle, deps, room } = createLifecycle({
      room: testRoom({ game: { phase: GAME_PHASES.skillPreview } })
    });

    expect(lifecycle.handleGameAction(room.code, "black", action, "io")).toEqual({
      ok: false,
      error: "当前阶段不能执行该操作"
    });
    expect(deps.startActiveSkill).not.toHaveBeenCalled();
  });

  test("allows resigns during pending counting or draw requests only", () => {
    const countingRoom = testRoom({ game: { phase: GAME_PHASES.countingRequested } });
    const countingLifecycle = createLifecycle({ room: countingRoom });

    expect(countingLifecycle.lifecycle.handleGameAction(countingRoom.code, "black", { type: "resign" }, "io")).toEqual({
      ok: true,
      standard: true
    });
    expect(countingLifecycle.deps.applyStandardGameAction).toHaveBeenCalledOnce();

    const reviewRoom = testRoom({ game: { phase: GAME_PHASES.resultReview } });
    const reviewLifecycle = createLifecycle({ room: reviewRoom });

    expect(reviewLifecycle.lifecycle.handleGameAction(reviewRoom.code, "black", { type: "resign" }, "io")).toEqual({
      ok: false,
      error: "当前阶段不能执行该操作"
    });
    expect(reviewLifecycle.deps.applyStandardGameAction).not.toHaveBeenCalled();
  });

  test("dispatches standard actions with room lifecycle dependencies", () => {
    const action = { type: "move", pointId: "aa" };
    const { lifecycle, deps, room } = createLifecycle();

    expect(lifecycle.handleGameAction(room.code, "black", action, "io")).toEqual({ ok: true, standard: true });
    expect(deps.applyStandardGameAction).toHaveBeenCalledWith({
      room,
      player: room.players[0],
      action,
      io: "io",
      appendSystem: deps.appendSystem,
      appendNotices: deps.appendNotices,
      broadcastToast: deps.broadcastToast,
      resetByoYomi: deps.resetByoYomi,
      scheduleRoomClose: deps.scheduleRoomClose,
      maybeStartPassiveSkill: deps.maybeStartPassiveSkill
    });
  });
});
