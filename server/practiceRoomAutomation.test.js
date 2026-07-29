import { describe, expect, it, vi } from "vitest";
import { COLORS, GAME_PHASES } from "../src/shared/game.js";
import { createPracticeRoom } from "./roomFactory.js";
import { createPracticeRoomAutomation } from "./practiceRoomAutomation.js";

function player() {
  return {
    user: {
      id: "human",
      username: "player",
      rating: 1000,
      rank: "3段",
      selectedCharacter: "sigrika",
      characterConfig: null
    },
    socketId: "socket-human"
  };
}

function automationHarness(room, {
  practiceEngine = {
    search: vi.fn().mockResolvedValue({
      ok: true,
      action: { type: "move", pointId: "3,3" }
    })
  }
} = {}) {
  let scheduledCallback = null;
  const rooms = new Map([[room.code, room]]);
  const handleGameAction = vi.fn(() => ({ ok: true, room }));
  const broadcastRoom = vi.fn();
  const appendSystem = vi.fn();
  const scheduleRoomClose = vi.fn();
  const automation = createPracticeRoomAutomation({
    rooms,
    scheduleRoomTimeout: (_room, callback) => { scheduledCallback = callback; },
    handleGameAction,
    respondCounting: vi.fn(),
    respondDraw: vi.fn(),
    handleScoringAction: vi.fn(),
    appendSystem,
    appendNotices: vi.fn(),
    scheduleRoomClose,
    broadcastRoom,
    random: () => 0,
    practiceEngine
  });
  return {
    automation,
    practiceEngine,
    handleGameAction,
    broadcastRoom,
    appendSystem,
    scheduleRoomClose,
    run: () => scheduledCallback?.()
  };
}

describe("practice room automation", () => {
  for (const difficulty of ["beginner", "intermediate", "advanced"]) {
    it(`makes ${difficulty} resign at 22 ordinary captures without early-invalid marking`, async () => {
      const room = createPracticeRoom(player(), { difficulty, playerColor: "black", random: () => 0 });
      room.game.phase = GAME_PHASES.playing;
      room.game.turn = COLORS.white;
      room.game.captures.black = 22;
      const harness = automationHarness(room);

      harness.automation.schedule(room, {});
      await harness.run();

      expect(room.game.phase).toBe(GAME_PHASES.finished);
      expect(room.game.winner).toMatchObject({ winnerColor: COLORS.black, reason: "resign" });
      expect(room.game.winner.invalid).toBeUndefined();
      expect(harness.handleGameAction).not.toHaveBeenCalled();
      expect(harness.broadcastRoom).toHaveBeenCalledWith({}, room);
    });
  }

  it("keeps the old 11-capture threshold for a restored beginner room without an explicit target", async () => {
    const room = createPracticeRoom(player(), { difficulty: "beginner", playerColor: "black", random: () => 0 });
    delete room.practice.captureResignThreshold;
    room.game.phase = GAME_PHASES.playing;
    room.game.turn = COLORS.white;
    room.game.captures.black = 11;
    const harness = automationHarness(room);

    harness.automation.schedule(room, {});
    await harness.run();

    expect(room.game.phase).toBe(GAME_PHASES.finished);
    expect(harness.handleGameAction).not.toHaveBeenCalled();
  });

  it("does not count skill removals toward the resignation threshold", async () => {
    const room = createPracticeRoom(player(), { difficulty: "beginner", playerColor: "black", random: () => 0 });
    room.game.phase = GAME_PHASES.playing;
    room.game.turn = COLORS.white;
    room.game.captures.black = 0;
    room.game.skillRemovals.black = 99;
    const harness = automationHarness(room);

    harness.automation.schedule(room, {});
    await harness.run();

    expect(room.game.phase).toBe(GAME_PHASES.playing);
    expect(harness.handleGameAction).toHaveBeenCalledWith(room.code, room.practice.botActorId, expect.objectContaining({ type: "move" }), {});
  });

  it.each(["beginner", "intermediate", "advanced"])("uses GNU Go for %s moves", async (difficulty) => {
    const room = createPracticeRoom(player(), { difficulty, playerColor: "black", random: () => 0 });
    room.game.phase = GAME_PHASES.playing;
    room.game.turn = COLORS.white;
    const practiceEngine = {
      search: vi.fn().mockResolvedValue({
        ok: true,
        action: { type: "move", pointId: "3,3" }
      })
    };
    const harness = automationHarness(room, { practiceEngine });

    harness.automation.schedule(room, {});
    await harness.run();

    expect(practiceEngine.search).toHaveBeenCalledWith(
      expect.objectContaining({ size: 13 }),
      COLORS.white,
      expect.objectContaining({
        id: difficulty,
        strategy: "gnugo"
      })
    );
    expect(harness.handleGameAction).toHaveBeenCalledWith(
      room.code,
      room.practice.botActorId,
      { type: "move", pointId: "3,3" },
      {}
    );
  });

  it("keeps one bot action in flight while GNU Go is thinking", async () => {
    const room = createPracticeRoom(player(), { difficulty: "advanced", playerColor: "black", random: () => 0 });
    room.game.phase = GAME_PHASES.playing;
    room.game.turn = COLORS.white;
    let resolveSearch;
    const practiceEngine = {
      search: vi.fn(() => new Promise((resolve) => { resolveSearch = resolve; }))
    };
    const harness = automationHarness(room, { practiceEngine });

    harness.automation.schedule(room, {});
    const pending = harness.run();
    expect(harness.automation.schedule(room, {})).toBe(false);
    resolveSearch({ ok: false, reason: "busy" });
    await pending;

    expect(practiceEngine.search).toHaveBeenCalledTimes(1);
    expect(harness.handleGameAction).not.toHaveBeenCalled();
  });

  it("does not fall back to homemade moves and closes after three engine failures", async () => {
    const room = createPracticeRoom(player(), { difficulty: "advanced", playerColor: "black", random: () => 0 });
    room.game.phase = GAME_PHASES.playing;
    room.game.turn = COLORS.white;
    const practiceEngine = {
      search: vi.fn().mockResolvedValue({ ok: false, reason: "unavailable" })
    };
    const harness = automationHarness(room, { practiceEngine });

    harness.automation.schedule(room, {});
    await harness.run();
    await harness.run();
    await harness.run();

    expect(practiceEngine.search).toHaveBeenCalledTimes(3);
    expect(harness.handleGameAction).not.toHaveBeenCalled();
    expect(room.game.phase).toBe(GAME_PHASES.finished);
    expect(room.game.winner).toMatchObject({
      winnerColor: COLORS.black,
      reason: "resign"
    });
    expect(harness.appendSystem).toHaveBeenCalledWith(
      room,
      "准时宝的 GNU Go 引擎暂时不可用，本局已结束。"
    );
    expect(harness.scheduleRoomClose).toHaveBeenCalledWith(room.code, {});
  });
});
