import { describe, expect, test } from "vitest";
import { GAME_PHASES } from "../src/shared/game.js";
import { createRoomMembershipIndex } from "./roomMembershipIndex.js";

describe("room membership index", () => {
  test("finds active rooms before finished review rooms for the same user", () => {
    const finished = room("11111", { phase: GAME_PHASES.finished, userIds: ["alice", "other"] });
    const active = room("22222", { phase: GAME_PHASES.playing, userIds: ["alice", "bob"] });
    const rooms = new Map([
      [finished.code, finished],
      [active.code, active]
    ]);
    const index = createRoomMembershipIndex({ rooms });

    index.registerRoom(finished);
    index.registerRoom(active);

    expect(index.findRoomForUser("alice")).toBe(active);
    expect(index.findRoomForUser("alice", finished.code)).toBe(finished);
    expect(index.isUserInActiveRoom("alice")).toBe(true);
  });

  test("falls back to finished rooms and returns false for missing active rooms", () => {
    const finished = room("11111", { phase: GAME_PHASES.finished, userIds: ["alice", "other"] });
    const rooms = new Map([[finished.code, finished]]);
    const index = createRoomMembershipIndex({ rooms });

    index.registerRoom(finished);

    expect(index.findRoomForUser("alice")).toBe(finished);
    expect(index.isUserInActiveRoom("alice")).toBe(false);
    expect(index.findRoomForUser("missing")).toBeNull();
    expect(index.isUserInActiveRoom("missing")).toBe(false);
  });

  test("unregisters by room object or room code", () => {
    const first = room("11111", { userIds: ["alice", "other"] });
    const second = room("22222", { userIds: ["alice", "bob"] });
    const rooms = new Map([
      [first.code, first],
      [second.code, second]
    ]);
    const index = createRoomMembershipIndex({ rooms });

    index.registerRoom(first);
    index.registerRoom(second);
    index.unregisterRoom(second);
    expect(index.findRoomForUser("alice")).toBe(first);

    index.unregisterRoom(first.code);
    rooms.delete(first.code);
    expect(index.findRoomForUser("alice")).toBeNull();
  });

  test("finds rooms by connected player and spectator sockets", () => {
    const first = room("11111", { userIds: ["alice", "other"] });
    first.players[0].socketId = "socket-a";
    const second = room("22222", { userIds: ["bob", "other"] });
    second.spectators = [{ user: { id: "watcher" }, socketId: "socket-a" }];
    const rooms = new Map([
      [first.code, first],
      [second.code, second]
    ]);
    const index = createRoomMembershipIndex({ rooms });

    index.registerRoom(first);
    index.registerRoom(second);

    expect(index.findRoomsForSocket("socket-a")).toEqual([first, second]);
    index.unregisterSocket(first, "socket-a");
    expect(index.findRoomsForSocket("socket-a")).toEqual([second]);
  });

  test("drops stale socket mappings while reading indexed rooms", () => {
    const active = room("11111", { userIds: ["alice", "bob"] });
    active.players[0].socketId = "socket-a";
    const rooms = new Map([[active.code, active]]);
    const index = createRoomMembershipIndex({ rooms });

    index.registerSocket(active, "socket-a");
    active.players[0].socketId = null;

    expect(index.findRoomsForSocket("socket-a")).toEqual([]);
    expect(index.findRoomsForSocket("socket-a")).toEqual([]);
  });

  test("clear removes every indexed membership", () => {
    const active = room("11111", { userIds: ["alice", "bob"] });
    const rooms = new Map([[active.code, active]]);
    const index = createRoomMembershipIndex({ rooms });

    index.registerRoom(active);
    index.clear();

    expect(index.findRoomForUser("alice")).toBeNull();
    expect(index.isUserInActiveRoom("bob")).toBe(false);
  });
});

function room(code, { phase = GAME_PHASES.playing, userIds = [] } = {}) {
  return {
    code,
    game: { phase },
    players: userIds.map((id, index) => ({
      color: index === 0 ? "black" : "white",
      user: { id }
    }))
  };
}
