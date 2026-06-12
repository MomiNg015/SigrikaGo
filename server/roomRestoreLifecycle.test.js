import { describe, expect, test, vi } from "vitest";
import { GAME_PHASES } from "../src/shared/game.js";
import { createRoomRestoreLifecycle } from "./roomRestoreLifecycle.js";

describe("room restore lifecycle", () => {
  test("closes expired finished rooms during restore", () => {
    const closeRoom = vi.fn();
    const scheduleRoomClose = vi.fn();
    const lifecycle = createLifecycle({
      closeRoom,
      scheduleRoomClose,
      now: () => 5000
    });
    const room = testRoom({
      game: { phase: GAME_PHASES.finished },
      closesAt: 4000
    });

    expect(lifecycle.resumeRoomTimers(room, "io")).toBe(false);
    expect(closeRoom).toHaveBeenCalledWith(room.code, "io", { reason: "finished-room-close" });
    expect(scheduleRoomClose).not.toHaveBeenCalled();
  });

  test("reschedules finished rooms whose close window has not expired", () => {
    const scheduleRoomClose = vi.fn();
    const lifecycle = createLifecycle({
      scheduleRoomClose,
      now: () => 3000
    });
    const room = testRoom({
      game: { phase: GAME_PHASES.finished },
      closesAt: 4000
    });

    expect(lifecycle.resumeRoomTimers(room, "io")).toBe(true);
    expect(scheduleRoomClose).toHaveBeenCalledWith(room.code, "io");
  });

  test("starts the clock and completes expired opening rooms", () => {
    const startGameClock = vi.fn();
    const completeRoomOpening = vi.fn();
    const scheduleGameStart = vi.fn();
    const lifecycle = createLifecycle({
      startGameClock,
      completeRoomOpening,
      scheduleGameStart,
      now: () => 5000
    });
    const room = testRoom({
      game: { phase: GAME_PHASES.opening },
      openingEndsAt: 4000
    });

    expect(lifecycle.resumeRoomTimers(room, "io")).toBe(true);
    expect(startGameClock).toHaveBeenCalledWith(room, "io");
    expect(completeRoomOpening).toHaveBeenCalledWith(room, "io");
    expect(scheduleGameStart).not.toHaveBeenCalled();
  });

  test("starts the clock and reschedules opening rooms that still have time", () => {
    const startGameClock = vi.fn();
    const completeRoomOpening = vi.fn();
    const scheduleGameStart = vi.fn();
    const lifecycle = createLifecycle({
      startGameClock,
      completeRoomOpening,
      scheduleGameStart,
      now: () => 3000
    });
    const room = testRoom({
      game: { phase: GAME_PHASES.opening },
      openingEndsAt: 4000
    });

    expect(lifecycle.resumeRoomTimers(room, "io")).toBe(true);
    expect(startGameClock).toHaveBeenCalledWith(room, "io");
    expect(scheduleGameStart).toHaveBeenCalledWith(room, "io");
    expect(completeRoomOpening).not.toHaveBeenCalled();
  });

  test("reschedules valid pending skill previews before active room deadlines", () => {
    const startGameClock = vi.fn();
    const schedulePendingSkillResolution = vi.fn(() => true);
    const schedulePendingRoomDeadlines = vi.fn();
    const scheduleEmptyActiveRoomClose = vi.fn();
    const lifecycle = createLifecycle({
      startGameClock,
      schedulePendingSkillResolution,
      schedulePendingRoomDeadlines,
      scheduleEmptyActiveRoomClose
    });
    const room = testRoom({
      game: {
        phase: GAME_PHASES.skillPreview,
        pendingSkill: { id: "skill-1" }
      }
    });

    expect(lifecycle.resumeRoomTimers(room, "io")).toBe(true);
    expect(schedulePendingSkillResolution).toHaveBeenCalledWith(room, "io");
    expect(room.game.phase).toBe(GAME_PHASES.skillPreview);
    expect(startGameClock).toHaveBeenCalledWith(room, "io");
    expect(schedulePendingRoomDeadlines).toHaveBeenCalledWith(room, "io");
    expect(scheduleEmptyActiveRoomClose).toHaveBeenCalledWith(room, "io");
  });

  test("falls invalid restored skill previews back to playing", () => {
    const schedulePendingSkillResolution = vi.fn(() => false);
    const lifecycle = createLifecycle({
      schedulePendingSkillResolution
    });
    const room = testRoom({
      game: {
        phase: GAME_PHASES.skillPreview,
        pendingSkill: { id: "stale-skill" }
      }
    });

    expect(lifecycle.resumeRoomTimers(room, "io")).toBe(true);
    expect(room.game).toMatchObject({
      phase: GAME_PHASES.playing,
      pendingSkill: null
    });
  });

  test("resumes active non-preview rooms with clock, deadlines, and empty-room close scheduling", () => {
    const startGameClock = vi.fn();
    const schedulePendingRoomDeadlines = vi.fn();
    const scheduleEmptyActiveRoomClose = vi.fn();
    const schedulePendingSkillResolution = vi.fn();
    const lifecycle = createLifecycle({
      startGameClock,
      schedulePendingRoomDeadlines,
      scheduleEmptyActiveRoomClose,
      schedulePendingSkillResolution
    });
    const room = testRoom({
      game: { phase: GAME_PHASES.drawRequested }
    });

    expect(lifecycle.resumeRoomTimers(room, "io")).toBe(true);
    expect(schedulePendingSkillResolution).not.toHaveBeenCalled();
    expect(startGameClock).toHaveBeenCalledWith(room, "io");
    expect(schedulePendingRoomDeadlines).toHaveBeenCalledWith(room, "io");
    expect(scheduleEmptyActiveRoomClose).toHaveBeenCalledWith(room, "io");
  });
});

function createLifecycle(overrides = {}) {
  return createRoomRestoreLifecycle({
    closeRoom: vi.fn(),
    scheduleRoomClose: vi.fn(),
    startGameClock: vi.fn(),
    completeRoomOpening: vi.fn(),
    scheduleGameStart: vi.fn(),
    schedulePendingSkillResolution: vi.fn(),
    schedulePendingRoomDeadlines: vi.fn(),
    scheduleEmptyActiveRoomClose: vi.fn(),
    now: () => 1000,
    ...overrides
  });
}

function testRoom(overrides = {}) {
  return {
    code: "12345",
    game: { phase: GAME_PHASES.playing },
    ...overrides
  };
}
