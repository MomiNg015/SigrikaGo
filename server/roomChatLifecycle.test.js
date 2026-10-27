import { describe, expect, test, vi } from "vitest";
import { createRoomChatLifecycle } from "./roomChatLifecycle.js";

function testRoom(overrides = {}) {
  return {
    code: "12345",
    chat: [],
    players: [{ user: { id: "u1", username: "Alice" }, socketId: "socket-1" }],
    spectators: [],
    game: { moveNumber: 7 },
    ...overrides
  };
}

function createLifecycle(overrides = {}) {
  const room = overrides.room ?? testRoom();
  const rooms = overrides.rooms ?? new Map([[room.code, room]]);
  const deps = {
    rooms,
    validateRoomCode: vi.fn((code) => ({ ok: true, value: code })),
    normalizeChatText: vi.fn((text) => ({ ok: true, value: text.trim() })),
    randomUUID: vi.fn(() => "chat-id"),
    now: vi.fn(() => 1234),
    ...overrides
  };

  return {
    lifecycle: createRoomChatLifecycle(deps),
    deps,
    room
  };
}

describe("room chat lifecycle", () => {
  test("returns null for invalid room codes before normalizing text", () => {
    const { lifecycle, deps } = createLifecycle({
      validateRoomCode: vi.fn(() => ({ ok: false, error: "bad room" }))
    });

    expect(lifecycle.addChat("bad", { id: "u1", username: "Alice" }, " hi ")).toBeNull();
    expect(deps.normalizeChatText).not.toHaveBeenCalled();
  });

  test("returns null for invalid normalized text before reading rooms", () => {
    const { lifecycle, deps } = createLifecycle({
      rooms: new Map(),
      normalizeChatText: vi.fn(() => ({ ok: false, error: "empty text" }))
    });

    expect(lifecycle.addChat("12345", { id: "u1", username: "Alice" }, "   ")).toBeNull();
    expect(deps.randomUUID).not.toHaveBeenCalled();
  });

  test("returns null when the validated room is gone", () => {
    const { lifecycle, deps } = createLifecycle({ rooms: new Map() });

    expect(lifecycle.addChat("12345", { id: "u1", username: "Alice" }, "hi")).toBeNull();
    expect(deps.randomUUID).not.toHaveBeenCalled();
  });

  test("appends normalized chat messages with the current move number", () => {
    const { lifecycle, room } = createLifecycle();

    const mutation = lifecycle.addChat("12345", { id: "u1", username: "Alice" }, " hi ", "socket-1");

    expect(mutation).toEqual({ room, message: room.chat[0] });
    expect(room.chat).toEqual([
      {
        id: "chat-id",
        type: "chat",
        userId: "u1",
        username: "Alice",
        moveNumber: 7,
        text: "hi",
        createdAt: 1234
      }
    ]);
  });

  test.each([
    ["outsider", "socket-2"], ["u1", "replaced-socket"], ["u1", undefined]
  ])("rejects unauthorized sender %s on %s without mutation", (id, socketId) => {
    const { lifecycle, room, deps } = createLifecycle();
    expect(lifecycle.addChat("12345", { id }, "hello", socketId)).toBeNull();
    expect(room.chat).toEqual([]);
    expect(deps.randomUUID).not.toHaveBeenCalled();
  });

  test("allows a currently attached spectator but rejects them after leaving", () => {
    const spectator = { user: { id: "viewer", username: "Viewer" }, socketId: "viewer-socket" };
    const { lifecycle, room } = createLifecycle({ room: testRoom({ spectators: [spectator] }) });
    expect(lifecycle.addChat("12345", spectator.user, "hello", spectator.socketId)?.message.username).toBe("Viewer");
    room.spectators = [];
    expect(lifecycle.addChat("12345", spectator.user, "again", spectator.socketId)).toBeNull();
    expect(room.chat).toHaveLength(1);
  });

  test("keeps the special duel chat disabled for its owner", () => {
    const { lifecycle } = createLifecycle({ room: testRoom({ sigrikaCandyDuel: {} }) });
    expect(lifecycle.addChat("12345", { id: "u1" }, "hello", "socket-1")).toBeNull();
  });
});
