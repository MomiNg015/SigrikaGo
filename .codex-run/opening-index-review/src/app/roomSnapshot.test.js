import { describe, expect, test } from "vitest";
import { applyRoomSnapshot, normalizeRoomSnapshot } from "./roomSnapshot.js";

describe("applyRoomSnapshot", () => {
  test("returns the current room when a duplicate snapshot arrives with fresh object identities", () => {
    const current = roomSnapshot();
    const incoming = roomSnapshot();

    expect(applyRoomSnapshot(current, incoming)).toBe(current);
  });

  test("reuses unchanged board points and players when only one point changes", () => {
    const current = roomSnapshot();
    const incoming = roomSnapshot({
      game: {
        ...roomSnapshot().game,
        points: [
          point("0,0", null),
          point("0,1", "black")
        ]
      }
    });

    const next = applyRoomSnapshot(current, incoming);

    expect(next).not.toBe(current);
    expect(next.game).not.toBe(current.game);
    expect(next.game.points).not.toBe(current.game.points);
    expect(next.game.points[0]).toBe(current.game.points[0]);
    expect(next.game.points[1]).not.toBe(current.game.points[1]);
    expect(next.players).toBe(current.players);
    expect(next.players[0]).toBe(current.players[0]);
  });

  test("reuses unchanged player entries when another player timer changes", () => {
    const current = roomSnapshot();
    const incoming = roomSnapshot({
      players: [
        player("black", { main: 299 }),
        player("white", { main: 300 })
      ]
    });

    const next = applyRoomSnapshot(current, incoming);

    expect(next.players).not.toBe(current.players);
    expect(next.players[0]).not.toBe(current.players[0]);
    expect(next.players[1]).toBe(current.players[1]);
    expect(next.game).toBe(current.game);
  });

  test("does not share state across different room identities", () => {
    const current = roomSnapshot({ code: "12345" });
    const incoming = roomSnapshot({ code: "54321" });

    expect(applyRoomSnapshot(current, incoming)).toBe(incoming);
  });

  test("normalizes incomplete recovered rooms before they enter UI state", () => {
    expect(normalizeRoomSnapshot({
      code: "12345",
      role: "player",
      game: { phase: "playing" }
    })).toEqual({
      code: "12345",
      role: "player",
      game: {
        phase: "playing",
        points: [],
        history: [],
        captures: { black: 0, white: 0 },
        skillUses: {}
      },
      players: [],
      spectators: [],
      chat: []
    });
  });
});

function roomSnapshot(overrides = {}) {
  return {
    code: "12345",
    role: "player",
    game: {
      phase: "playing",
      turn: "black",
      points: [
        point("0,0", null),
        point("0,1", null)
      ],
      history: [{ id: "move-1", type: "move", pointId: "0,0" }],
      skillUses: { black: 1, white: 1 }
    },
    players: [
      player("black", { main: 300 }),
      player("white", { main: 300 })
    ],
    chat: [{ id: "start", type: "system", text: "start" }],
    ...overrides
  };
}

function point(id, stone) {
  const [x, y] = id.split(",").map(Number);
  return { id, x, y, valid: true, stone };
}

function player(color, time) {
  return {
    color,
    captures: 0,
    time,
    user: { id: `user-${color}`, username: color, rating: 1000, rank: "1级" }
  };
}
