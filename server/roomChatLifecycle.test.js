import { describe, expect, test, vi } from "vitest";
import { createRoomChatLifecycle } from "./roomChatLifecycle.js";

function testRoom(overrides = {}) {
  return {
    code: "12345",
    chat: [],
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

    expect(lifecycle.addChat("12345", { id: "u1", username: "Alice" }, " hi ")).toBe(room);
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
});
