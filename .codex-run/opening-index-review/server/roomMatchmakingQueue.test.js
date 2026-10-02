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
  test("queues unmatched players and reports counts by mode", () => {
    const queue = createRoomMatchmakingQueue();

    expect(queue.join(player("spark-a", "socket-a")).matched).toBe(false);
    expect(queue.join(player("standard-a", "socket-b", "standard")).matched).toBe(false);
    expect(queue.join(player("gomoku-a", "socket-c", "gomoku")).matched).toBe(false);

    expect(queue.count()).toBe(3);
    expect(queue.countsByMode()).toEqual({ spark: 1, standard: 1, gomoku: 1 });
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
