import { describe, expect, test, vi } from "vitest";
import { GAME_PHASES } from "../src/shared/game.js";
import { createRoomQueries } from "./roomQueries.js";

function room(code, overrides = {}) {
  return {
    code,
    mode: overrides.mode,
    closesAt: overrides.closesAt,
    players: overrides.players ?? [
      { color: "black", user: { id: `${code}-black` } },
      { color: "white", user: { id: `${code}-white` } }
    ],
    game: {
      phase: GAME_PHASES.playing,
      mode: "spark",
      moveNumber: 3,
      ...overrides.game
    }
  };
}

function createQueries(overrides = {}) {
  const rooms = overrides.rooms ?? new Map();
  const deps = {
    rooms,
    onlineParticipantCount: vi.fn(() => 2),
    watchPlayerSummary: vi.fn((candidate, color) => ({ roomCode: candidate.code, color })),
    ...overrides
  };

  return {
    queries: createRoomQueries(deps),
    deps
  };
}

describe("room queries", () => {
  test("lists active rooms by excluding finished rooms", () => {
    const active = room("active");
    const finished = room("finished", { game: { phase: GAME_PHASES.finished } });
    const { queries } = createQueries({
      rooms: new Map([
        [active.code, active],
        [finished.code, finished]
      ])
    });

    expect(queries.listActiveRooms()).toEqual([active]);
  });

  test("projects watch rooms with online count, status, mode fallback, and player summaries", () => {
    const playing = room("playing", { mode: "standard", closesAt: 5000, game: { moveNumber: 12 } });
    const finished = room("finished", { game: { phase: GAME_PHASES.finished, mode: "standard", moveNumber: 20 } });
    const { queries, deps } = createQueries({
      rooms: new Map([
        [playing.code, playing],
        [finished.code, finished]
      ])
    });

    expect(queries.listWatchRooms()).toEqual([
      {
        code: "playing",
        mode: "standard",
        onlineCount: 2,
        moveNumber: 12,
        status: "playing",
        closesAt: 5000,
        black: { roomCode: "playing", color: "black" },
        white: { roomCode: "playing", color: "white" }
      },
      {
        code: "finished",
        mode: "standard",
        onlineCount: 2,
        moveNumber: 20,
        status: "finished",
        closesAt: null,
        black: { roomCode: "finished", color: "black" },
        white: { roomCode: "finished", color: "white" }
      }
    ]);
    expect(deps.onlineParticipantCount).toHaveBeenCalledWith(playing);
    expect(deps.watchPlayerSummary).toHaveBeenCalledWith(playing, "black");
    expect(deps.watchPlayerSummary).toHaveBeenCalledWith(playing, "white");
  });

  test("checks active-room membership without counting finished rooms", () => {
    const active = room("active", { players: [{ user: { id: "alice" } }] });
    const finished = room("finished", {
      players: [{ user: { id: "bob" } }],
      game: { phase: GAME_PHASES.finished }
    });
    const { queries } = createQueries({
      rooms: new Map([
        [active.code, active],
        [finished.code, finished]
      ])
    });

    expect(queries.isUserInActiveRoom("alice")).toBe(true);
    expect(queries.isUserInActiveRoom("bob")).toBe(false);
  });

  test("finds rooms for users globally or within a specific room code", () => {
    const first = room("first", { players: [{ user: { id: "alice" } }] });
    const second = room("second", { players: [{ user: { id: "bob" } }] });
    const { queries } = createQueries({
      rooms: new Map([
        [first.code, first],
        [second.code, second]
      ])
    });

    expect(queries.findRoomForUser("bob")).toBe(second);
    expect(queries.findRoomForUser("bob", "first")).toBeNull();
    expect(queries.findRoomForUser("alice", "first")).toBe(first);
  });
});
