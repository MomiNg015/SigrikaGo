import { describe, expect, it, vi } from "vitest";
import { GAME_PHASES } from "../src/shared/game.js";
import {
  CURRENT_ROOM_SNAPSHOT_VERSION,
  hydratePersistedRoom,
  persistRoomState,
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
      createdAt: 1,
      lastTick: 2,
      recordSaved: false
    };

    expect(roomPersistenceSnapshot(room)).toMatchObject({
      snapshotVersion: CURRENT_ROOM_SNAPSHOT_VERSION,
      code: "ABCDE",
      players: [{ user: { id: "black" }, socketId: null, disconnectedAt: null }],
      spectators: [],
      game: room.game,
      chat: []
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

    persistRoomState({ prisma: {}, room, upsert, force: true, now: () => 1200, throttleMs: 5000 });
    expect(upsert).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      code: "ABCDE",
      status: "active"
    }));
    await Promise.resolve();
  });
});
