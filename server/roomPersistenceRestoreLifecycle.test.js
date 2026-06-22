import { describe, expect, test, vi } from "vitest";
import { createRoomPersistenceRestoreLifecycle } from "./roomPersistenceRestoreLifecycle.js";

function createLifecycle(overrides = {}) {
  const rooms = overrides.rooms ?? new Map();
  const deps = {
    rooms,
    listPersistedRooms: vi.fn(async () => []),
    hydratePersistedRoom: vi.fn((snapshot) => snapshot),
    ensureRestoredDisconnectedNotices: vi.fn(),
    registerRoom: vi.fn(),
    resumeRoomTimers: vi.fn(() => true),
    persistRoom: vi.fn(),
    onError: vi.fn(),
    ...overrides
  };

  return {
    lifecycle: createRoomPersistenceRestoreLifecycle(deps),
    deps
  };
}

describe("room persistence restore lifecycle", () => {
  test("hydrates, registers, resumes, and force-persists restored rooms", async () => {
    const room = { code: "12345", game: {} };
    const { lifecycle, deps } = createLifecycle({
      listPersistedRooms: vi.fn(async () => [{ code: "12345", snapshot: JSON.stringify({ code: "12345" }) }]),
      hydratePersistedRoom: vi.fn(() => room)
    });

    await expect(lifecycle.restorePersistedRooms("io")).resolves.toEqual([room]);

    expect(deps.hydratePersistedRoom).toHaveBeenCalledWith({ code: "12345" });
    expect(deps.ensureRestoredDisconnectedNotices).toHaveBeenCalledWith(room);
    expect(deps.rooms.get(room.code)).toBe(room);
    expect(deps.registerRoom).toHaveBeenCalledWith(room);
    expect(deps.resumeRoomTimers).toHaveBeenCalledWith(room, "io");
    expect(deps.persistRoom).toHaveBeenCalledWith(room, { force: true });
  });

  test("skips hydrated rows without a room code", async () => {
    const { lifecycle, deps } = createLifecycle({
      listPersistedRooms: vi.fn(async () => [{ code: "missing", snapshot: "{}" }])
    });

    await expect(lifecycle.restorePersistedRooms("io")).resolves.toEqual([]);

    expect(deps.ensureRestoredDisconnectedNotices).not.toHaveBeenCalled();
    expect(deps.registerRoom).not.toHaveBeenCalled();
    expect(deps.resumeRoomTimers).not.toHaveBeenCalled();
    expect(deps.persistRoom).not.toHaveBeenCalled();
    expect(deps.rooms.size).toBe(0);
  });

  test("does not persist rooms that close during restore resume", async () => {
    const room = { code: "done", game: {} };
    const { lifecycle, deps } = createLifecycle({
      listPersistedRooms: vi.fn(async () => [{ code: "done", snapshot: JSON.stringify({ code: "done" }) }]),
      hydratePersistedRoom: vi.fn(() => room),
      resumeRoomTimers: vi.fn(() => false)
    });

    await expect(lifecycle.restorePersistedRooms("io")).resolves.toEqual([room]);

    expect(deps.rooms.get(room.code)).toBe(room);
    expect(deps.registerRoom).toHaveBeenCalledWith(room);
    expect(deps.persistRoom).not.toHaveBeenCalled();
  });

  test("logs bad rows and continues restoring later rows", async () => {
    const room = { code: "good", game: {} };
    const parseError = expect.any(SyntaxError);
    const { lifecycle, deps } = createLifecycle({
      listPersistedRooms: vi.fn(async () => [
        { code: "bad", snapshot: "{" },
        { code: "good", snapshot: JSON.stringify({ code: "good" }) }
      ]),
      hydratePersistedRoom: vi.fn((snapshot) => snapshot.code === "good" ? room : snapshot)
    });

    await expect(lifecycle.restorePersistedRooms("io")).resolves.toEqual([room]);

    expect(deps.onError).toHaveBeenCalledWith("Failed to restore room bad", parseError);
    expect(deps.rooms.get("good")).toBe(room);
    expect(deps.persistRoom).toHaveBeenCalledWith(room, { force: true });
  });
});
