import { describe, expect, test } from "vitest";
import { createRoomMatchmakingQueue } from "./roomMatchmakingQueue.js";

function player(id, socketId, mode = "spark") {
  return {
    user: { id },
    socketId,
    mode
  };
}

describe("roomMatchmakingQueue", () => {
  test("waits for both distant players to reach 15 seconds without resetting queue time", () => {
    let time = 1000;
    const queue = createRoomMatchmakingQueue({ now: () => time });
    const first = { ...player("a", "a"), user: { id: "a", rank: "3段" } };
    const second = { ...player("b", "b"), user: { id: "b", rank: "6段" } };
    queue.join(first);
    time = 2000;
    expect(queue.join(second).matched).toBe(false);
    time = 16000;
    expect(queue.join(first).matched).toBe(false);
    expect(queue.list().find((entry) => entry.user.id === "a").queuedAt).toBe(1000);
    time = 17000;
    expect(queue.join(second).matched).toBe(true);
    expect(queue.count()).toBe(0);
  });

  test("prefers the closest eligible rank, uses mode ranks and includes a distance of two", () => {
    const queue = createRoomMatchmakingQueue();
    const ranked = (id, rank) => ({ ...player(id, id, "standard"), user: { id, rank: "9段", modeStats: { standard: { rank } } } });
    queue.join(ranked("far", "5段"));
    queue.join(ranked("near", "4段"), { canPair: () => false });
    expect(queue.join(ranked("new", "3段")).opponent.user.id).toBe("near");
    expect(queue.join(ranked("boundary", "3段")).opponent.user.id).toBe("far");
  });

  test("preserves blacklist filtering after expansion", () => {
    let time = 0;
    const queue = createRoomMatchmakingQueue({ now: () => time });
    const first = { ...player("a", "a"), user: { id: "a", rank: "1段" } };
    const second = { ...player("b", "b"), user: { id: "b", rank: "9段" } };
    queue.join(first);
    queue.join(second);
    time = 15000;
    expect(queue.join(first, { canPair: () => false }).matched).toBe(false);
    queue.removeSocket("b");
    expect(queue.join(first).matched).toBe(false);
  });

  test("queues unmatched players and reports counts by mode", () => {
    const queue = createRoomMatchmakingQueue();

    expect(queue.join(player("spark-a", "socket-a")).matched).toBe(false);
    expect(queue.join(player("standard-a", "socket-b", "standard")).matched).toBe(false);
    expect(queue.join(player("gomoku-a", "socket-c", "gomoku")).matched).toBe(false);

    expect(queue.count()).toBe(3);
    expect(queue.countsByMode()).toEqual({ spark: 1, standard: 1, gomoku: 1, team: 0 });
    expect(queue.list().map((entry) => entry.user.id)).toEqual(["spark-a", "standard-a", "gomoku-a"]);
  });

  test("matches only players in the same normalized mode", () => {
    const queue = createRoomMatchmakingQueue();

    queue.join(player("standard-a", "socket-a", "standard"));
    queue.join(player("spark-a", "socket-b", "spark"));
    queue.join(player("gomoku-a", "socket-d", "gomoku"));
    const match = queue.join(player("standard-b", "socket-c", "standard"));

    expect(match).toMatchObject({
      matched: true,
      mode: "standard",
      opponent: { user: { id: "standard-a" } },
      player: { user: { id: "standard-b" } }
    });
    expect(queue.list().map((entry) => entry.user.id)).toEqual(["spark-a", "gomoku-a"]);
  });

  test("deduplicates by user id and socket id before joining", () => {
    const queue = createRoomMatchmakingQueue();

    queue.join(player("same-user", "socket-a"));
    queue.join(player("same-user", "socket-b"));
    queue.join(player("other-user", "socket-b"));

    expect(queue.list().map((entry) => [entry.user.id, entry.socketId])).toEqual([
      ["other-user", "socket-b"]
    ]);
  });

  test("keeps incompatible players queued until a compatible player joins", () => {
    const queue = createRoomMatchmakingQueue();

    queue.join(player("blocked-a", "socket-a"));
    const blocked = queue.join(player("blocked-b", "socket-b"), { canPair: () => false });
    const match = queue.join(player("compatible", "socket-c"), {
      canPair: (candidate) => candidate.user.id === "blocked-b"
    });

    expect(blocked.matched).toBe(false);
    expect(match.matched).toBe(true);
    expect(match.opponent.user.id).toBe("blocked-b");
    expect(queue.list().map((entry) => entry.user.id)).toEqual(["blocked-a"]);
  });

  test("removes queued players by user or socket and clears the queue", () => {
    const queue = createRoomMatchmakingQueue();

    queue.join(player("user-a", "socket-a"));
    queue.join(player("user-b", "socket-b"));
    queue.removeUser("user-a");
    queue.removeSocket("socket-b");

    expect(queue.count()).toBe(0);

    queue.join(player("user-c", "socket-c"));
    queue.clear();

    expect(queue.list()).toEqual([]);
  });
});
