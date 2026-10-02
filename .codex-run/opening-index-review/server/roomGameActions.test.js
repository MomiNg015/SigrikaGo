import { describe, expect, it, vi } from "vitest";
import { COLORS, createGameState } from "../src/shared/game.js";
import { applyStandardGameAction } from "./roomGameActions.js";

describe("room game action flow", () => {
  it("applies a pass action and runs the room side effects", () => {
    const room = {
      code: "12345",
      game: createGameState([{ color: COLORS.black }, { color: COLORS.white }])
    };
    const player = { color: COLORS.black, user: { username: "black" } };
    const calls = [];

    const result = applyStandardGameAction({
      room,
      player,
      action: { type: "pass" },
      io: {},
      appendSystem: (_room, text) => calls.push(["system", text]),
      appendNotices: vi.fn(),
      broadcastToast: vi.fn(),
      resetByoYomi: () => calls.push(["reset"]),
      scheduleRoomClose: vi.fn(),
      maybeStartPassiveSkill: () => calls.push(["passive"])
    });

    expect(result.ok).toBe(true);
    expect(room.game.turn).toBe(COLORS.white);
    expect(calls).toContainEqual(["reset"]);
    expect(calls).toContainEqual(["passive"]);
    expect(calls.some(([type, text]) => type === "system" && text.includes("弃一手"))).toBe(true);
  });
});
