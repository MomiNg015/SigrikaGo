import { describe, expect, it } from "vitest";
import { COLORS, GAME_PHASES, createGameState } from "../src/shared/game.js";
import {
  ROOM_TEST_ACTION_TYPES,
  handleRoomTestAction,
  isRoomTestAction
} from "./roomTestActions.js";

function testRoom() {
  const black = {
    color: COLORS.black,
    time: { main: 120, byoYomi: 30, periodRemaining: 12, periods: 3 }
  };
  return {
    game: createGameState([{ color: COLORS.black }, { color: COLORS.white }]),
    chat: [],
    players: [
      black,
      {
        color: COLORS.white,
        time: { main: 120, byoYomi: 30, periodRemaining: 12, periods: 3 }
      }
    ]
  };
}

describe("room test actions", () => {
  it("centralizes the room debug action list", () => {
    expect(ROOM_TEST_ACTION_TYPES).toEqual(new Set([
      "test-random-layout",
      "test-restore-skill",
      "test-enter-byo-yomi"
    ]));
    expect(isRoomTestAction({ type: "test-random-layout" })).toBe(true);
    expect(isRoomTestAction({ type: "move" })).toBe(false);
  });

  it("rejects all test actions in production even when explicitly enabled", () => {
    const room = testRoom();
    const result = handleRoomTestAction({
      action: { type: "test-restore-skill" },
      env: { NODE_ENV: "production", ENABLE_TEST_ACTIONS: "1" },
      player: room.players[0],
      room
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("测试工具");
  });

  it("handles entering byo-yomi without running normal move effects", () => {
    const room = testRoom();
    room.game.phase = GAME_PHASES.playing;
    const result = handleRoomTestAction({
      action: { type: "test-enter-byo-yomi" },
      env: {},
      player: room.players[0],
      room
    });

    expect(result.ok).toBe(true);
    expect(room.players[0].time.main).toBe(0);
    expect(room.players[1].time.main).toBe(0);
    expect(result.result).toBeNull();
    expect(result.skipByoYomiReset).toBe(true);
  });
});
