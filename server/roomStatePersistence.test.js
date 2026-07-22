import { describe, expect, it, vi } from "vitest";
import { GAME_PHASES } from "../src/shared/game.js";
import {
  CURRENT_ROOM_SNAPSHOT_VERSION,
  flushRoomPersistence,
  hydratePersistedRoom,
  persistRoomState,
  roomPersistenceStats,
  roomPersistenceSnapshot
} from "./roomStatePersistence.js";

describe("room state persistence", () => {
  it("snapshots rooms without socket ids or spectators", () => {
    const room = {
      code: "ABCDE",
      players: [
        { user: { id: "black" }, socketId: "socket-a", disconnectedAt: null }
      ],
      spectators: [{ user: { id: "viewer" }, socketId: "socket-v" }],
      game: { phase: GAME_PHASES.playing },
      chat: [],
      actionReceipts: {
        black: [{ ok: true, actionId: "action-1", roomCode: "ABCDE", revision: 3 }]
      },
      revision: 3,
      clockSeq: 4,
      createdAt: 1,
      lastTick: 2,
      recordSaved: false
    };

    expect(roomPersistenceSnapshot(room)).toMatchObject({
      snapshotVersion: CURRENT_ROOM_SNAPSHOT_VERSION,
      code: "ABCDE",
      revision: 3,
      clockSeq: 4,
      players: [{ user: { id: "black" }, socketId: null, disconnectedAt: null }],
      spectators: [],
      game: room.game,
      chat: [],
      actionReceipts: room.actionReceipts
    });
  });

  it("hydrates persisted active rooms with fresh runtime timer and disconnected player fields", () => {
    const room = hydratePersistedRoom({
      code: "ABCDE",
      players: [{ user: { id: "black" }, socketId: "stale" }],
      spectators: [{ user: { id: "viewer" } }],
      game: { phase: GAME_PHASES.playing }
    }, { now: () => 12345 });

    expect(room.players[0]).toMatchObject({ socketId: null, disconnectedAt: 12345 });
    expect(room.spectators).toEqual([]);
    expect(room.timerId).toBeNull();
    expect(room.timeoutIds).toEqual([]);
    expect(room.emptyTimerId).toBeNull();
    expect(room.lastTick).toBe(12345);
    expect(room.lastPersistedAt).toBe(0);
    expect(room.revision).toBe(0);
    expect(room.clockSeq).toBe(0);
    expect(room.actionReceipts).toEqual({});
  });

  it("keeps finished room players without disconnected markers when hydrated", () => {
    const room = hydratePersistedRoom({
      code: "ABCDE",
      players: [{ user: { id: "black" }, socketId: "stale" }],
      spectators: [],
      game: { phase: GAME_PHASES.finished }
    }, { now: () => 12345 });

    expect(room.players[0]).toMatchObject({ socketId: null, disconnectedAt: null });
  });

  it("rejects future room snapshot versions instead of hydrating incompatible state", () => {
    expect(() => hydratePersistedRoom({
      snapshotVersion: CURRENT_ROOM_SNAPSHOT_VERSION + 1,
      code: "ABCDE",
      players: [],
      spectators: [],
      game: { phase: GAME_PHASES.playing }
    })).toThrow("Unsupported room snapshot version");
  });

  it("throttles persistence unless forced", async () => {
    const upsert = vi.fn(async () => {});
    const room = {
      code: "ABCDE",
      players: [],
      spectators: [],
      game: { phase: GAME_PHASES.playing },
      chat: [],
      lastPersistedAt: 1000
    };

    persistRoomState({ prisma: {}, room, upsert, now: () => 1200, throttleMs: 5000 });
    expect(upsert).not.toHaveBeenCalled();

    await persistRoomState({ prisma: {}, room, upsert, force: true, now: () => 1200, throttleMs: 5000 });
    expect(upsert).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      code: "ABCDE",
      status: "active"
    }));
  });

  it("serializes persistence writes for the same room code", async () => {
    const first = deferred();
    const upsert = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce();
    const room = {
      code: "SERIAL",
      players: [],
      spectators: [],
      game: { phase: GAME_PHASES.playing },
      chat: [],
      revision: 1
    };

    const firstPersist = persistRoomState({ prisma: {}, room, upsert, force: true, now: () => 1000, throttleMs: 5000 });
    room.revision = 2;
    const secondPersist = persistRoomState({ prisma: {}, room, upsert, force: true, now: () => 1100, throttleMs: 5000 });

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(JSON.parse(upsert.mock.calls[0][1].snapshot).revision).toBe(1);

    first.resolve();
    await Promise.all([firstPersist, secondPersist]);

    expect(upsert).toHaveBeenCalledTimes(2);
    expect(JSON.parse(upsert.mock.calls[1][1].snapshot).revision).toBe(2);
  });

  it("does not block persistence writes for different room codes", async () => {
    const first = deferred();
    const upsert = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce();

    const firstPersist = persistRoomState({
      prisma: {},
      room: roomForPersistence("FIRST"),
      upsert,
      force: true,
      now: () => 1000,
      throttleMs: 5000
    });
    const secondPersist = persistRoomState({
      prisma: {},
      room: roomForPersistence("SECOND"),
      upsert,
      force: true,
      now: () => 1000,
      throttleMs: 5000
    });

    expect(upsert).toHaveBeenCalledTimes(2);

    first.resolve();
    await Promise.all([firstPersist, secondPersist]);
  });

  it("flushes one room code without waiting for unrelated room writes", async () => {
    const first = deferred();
    const second = deferred();
    const upsert = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);

    persistRoomState({
      prisma: {},
      room: roomForPersistence("FIRST"),
      upsert,
      force: true,
      now: () => 1000,
      throttleMs: 5000
    });
    persistRoomState({
      prisma: {},
      room: roomForPersistence("SECOND"),
      upsert,
      force: true,
      now: () => 1000,
      throttleMs: 5000
    });

    const flushFirst = flushRoomPersistence("FIRST").then(() => "flushed");
    first.resolve();

    try {
      await expect(Promise.race([
        flushFirst,
        nextTick().then(() => "still-waiting")
      ])).resolves.toBe("flushed");
    } finally {
      second.resolve();
      await flushRoomPersistence();
    }
  });

  it("retains practice metadata and keeps the virtual bot connected-state neutral", () => {
    const snapshot = roomPersistenceSnapshot({
      code: "BOT01",
      mode: "spark",
      rated: false,
      matchSource: "practice",
      recordPolicy: "none",
      practice: { botId: "zhunshibao", difficulty: "beginner" },
      players: [{ user: { id: "bot", isBot: true }, isBot: true, socketId: null }],
      spectators: [],
      game: { phase: GAME_PHASES.playing },
      chat: []
    });
    const hydrated = hydratePersistedRoom(snapshot, { now: () => 12345 });

    expect(hydrated).toMatchObject({
      rated: false,
      matchSource: "practice",
      recordPolicy: "none",
      practice: { botId: "zhunshibao", difficulty: "beginner" }
    });
    expect(hydrated.players[0].disconnectedAt).toBeNull();
  });

  it("reports pending persistence rooms for runtime capacity telemetry", async () => {
    const write = deferred();
    persistRoomState({
      prisma: {},
      room: roomForPersistence("METRICS"),
      upsert: () => write.promise,
      force: true,
      now: () => 1000,
      throttleMs: 5000
    });

    expect(roomPersistenceStats()).toEqual({ pendingRooms: 1 });
    write.resolve();
    await flushRoomPersistence();
    expect(roomPersistenceStats()).toEqual({ pendingRooms: 0 });
  });
});

function roomForPersistence(code) {
  return {
    code,
    players: [],
    spectators: [],
    game: { phase: GAME_PHASES.playing },
    chat: []
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
