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

function automationHarness(room) {
  let scheduledCallback = null;
  const rooms = new Map([[room.code, room]]);
  const handleGameAction = vi.fn(() => ({ ok: true, room }));
  const broadcastRoom = vi.fn();
  const automation = createPracticeRoomAutomation({
    rooms,
    scheduleRoomTimeout: (_room, callback) => { scheduledCallback = callback; },
    handleGameAction,
    respondCounting: vi.fn(),
    respondDraw: vi.fn(),
    handleScoringAction: vi.fn(),
    appendSystem: vi.fn(),
    appendNotices: vi.fn(),
    scheduleRoomClose: vi.fn(),
    broadcastRoom,
    random: () => 0
  });
  return { automation, handleGameAction, broadcastRoom, run: () => scheduledCallback?.() };
}

describe("practice room automation", () => {
  for (const [difficulty, threshold] of [["beginner", 11], ["basic", 22]]) {
    it(`makes ${difficulty} resign at ${threshold} ordinary captures without early-invalid marking`, () => {
      const room = createPracticeRoom(player(), { difficulty, playerColor: "black", random: () => 0 });
      room.game.phase = GAME_PHASES.playing;
      room.game.turn = COLORS.white;
      room.game.captures.black = threshold;
      const harness = automationHarness(room);

      harness.automation.schedule(room, {});
      harness.run();

      expect(room.game.phase).toBe(GAME_PHASES.finished);
      expect(room.game.winner).toMatchObject({ winnerColor: COLORS.black, reason: "resign" });
      expect(room.game.winner.invalid).toBeUndefined();
      expect(harness.handleGameAction).not.toHaveBeenCalled();
      expect(harness.broadcastRoom).toHaveBeenCalledWith({}, room);
    });
  }

  it("does not count skill removals toward the resignation threshold", () => {
    const room = createPracticeRoom(player(), { difficulty: "beginner", playerColor: "black", random: () => 0 });
    room.game.phase = GAME_PHASES.playing;
    room.game.turn = COLORS.white;
    room.game.captures.black = 0;
    room.game.skillRemovals.black = 99;
    const harness = automationHarness(room);

    harness.automation.schedule(room, {});
    harness.run();

    expect(room.game.phase).toBe(GAME_PHASES.playing);
    expect(harness.handleGameAction).toHaveBeenCalledWith(room.code, room.practice.botActorId, expect.objectContaining({ type: "move" }), {});
  });
});
