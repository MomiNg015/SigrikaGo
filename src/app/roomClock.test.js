import { describe, expect, test } from "vitest";
import { applyRoomClock } from "./roomClock.js";

describe("applyRoomClock", () => {
  test("updates player time from a matching lightweight clock payload without replacing game state", () => {
    const game = { moveNumber: 12 };
    const room = {
      code: "12345",
      game,
      players: [
        { color: "black", user: { id: "black-user" }, time: { main: 300, byoYomi: 30, periodRemaining: 30, periods: 3 } },
        { color: "white", user: { id: "white-user" }, time: { main: 300, byoYomi: 30, periodRemaining: 30, periods: 3 } }
      ]
    };

    const next = applyRoomClock(room, {
      roomCode: "12345",
      activeColor: "black",
      serverNow: 1000,
      players: [
        { color: "black", time: { main: 299, byoYomi: 30, periodRemaining: 30, periods: 3 } },
        { color: "white", time: { main: 300, byoYomi: 30, periodRemaining: 30, periods: 3 } }
      ]
    });

    expect(next).not.toBe(room);
    expect(next.game).toBe(game);
    expect(next.players[0]).not.toBe(room.players[0]);
    expect(next.players[1]).toBe(room.players[1]);
    expect(next.players[0].time.main).toBe(299);
  });

  test("ignores clock payloads for a different room", () => {
    const room = { code: "12345", players: [], game: {} };

    expect(applyRoomClock(room, { roomCode: "99999", players: [] })).toBe(room);
  });
});
