import { describe, expect, test, vi } from "vitest";
import { GAME_PHASES } from "../src/shared/game.js";
import { createRoomOpeningLifecycle } from "./roomOpeningLifecycle.js";

function testRoom(overrides = {}) {
  return {
    code: "12345",
    lastTick: 0,
    game: {
      phase: GAME_PHASES.opening,
      ...overrides.game
    },
    ...overrides
  };
}

function createLifecycle(overrides = {}) {
  const deps = {
    appendSystem: vi.fn(),
    broadcastRoom: vi.fn(),
    scheduleInitialPassiveSkill: vi.fn(),
    maybeStartPassiveSkill: vi.fn(() => false),
    now: vi.fn(() => 1234),
    ...overrides
  };

  return {
    lifecycle: createRoomOpeningLifecycle(deps),
    deps
  };
}

describe("room opening lifecycle", () => {
  test("completes opening rooms and schedules initial passive skill", () => {
    const room = testRoom();
    const { lifecycle, deps } = createLifecycle();

    expect(lifecycle.completeRoomOpening(room, "io")).toBe(true);
    expect(room.game.phase).toBe(GAME_PHASES.playing);
    expect(room.lastTick).toBe(1234);
    expect(deps.appendSystem).toHaveBeenCalledWith(room, "对局开始。", { kind: "game-start" });
    expect(deps.broadcastRoom).toHaveBeenCalledWith("io", room);
    expect(deps.scheduleInitialPassiveSkill).toHaveBeenCalledWith(room, "io");
  });

  test("leaves non-opening rooms unchanged", () => {
    const room = testRoom({ game: { phase: GAME_PHASES.playing } });
    const { lifecycle, deps } = createLifecycle();

    expect(lifecycle.completeRoomOpening(room, "io")).toBe(false);
    expect(room.game.phase).toBe(GAME_PHASES.playing);
    expect(room.lastTick).toBe(0);
    expect(deps.appendSystem).not.toHaveBeenCalled();
    expect(deps.broadcastRoom).not.toHaveBeenCalled();
    expect(deps.scheduleInitialPassiveSkill).not.toHaveBeenCalled();
  });

  test("starts initial passive skills through the skill lifecycle", () => {
    const room = testRoom();
    const maybeStartPassiveSkill = vi.fn(() => true);
    const { lifecycle } = createLifecycle({ maybeStartPassiveSkill });

    expect(lifecycle.startInitialPassiveSkillNow(room, "io")).toBe(true);
    expect(maybeStartPassiveSkill).toHaveBeenCalledWith(room, "io");
  });
});
