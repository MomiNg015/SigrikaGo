import { describe, expect, it, vi } from "vitest";
import { registerPracticeSocketEvents } from "./socketPracticeEvents.js";

function createSocket() {
  const handlers = new Map();
  return {
    id: "socket-1",
    user: { id: "user-1" },
    on: vi.fn((event, handler) => handlers.set(event, handler)),
    trigger: (event, ...args) => handlers.get(event)(...args)
  };
}

describe("practice socket events", () => {
  it("creates an authoritative practice room and acknowledges its code", async () => {
    const socket = createSocket();
    const acknowledge = vi.fn();
    const createPracticeRoom = vi.fn(() => ({ code: "24680" }));
    registerPracticeSocketEvents(socket, {
      io: {},
      refreshSocketUser: vi.fn(),
      createPracticeRoom,
      isUserInActiveRoom: () => false,
      leaveMatchmaking: vi.fn()
    });

    await socket.trigger("practice:start", { difficulty: "beginner", playerColor: "random" }, acknowledge);

    expect(createPracticeRoom).toHaveBeenCalledWith(
      expect.objectContaining({ socketId: "socket-1" }),
      {},
      { difficulty: "beginner", playerColor: "random" }
    );
    expect(acknowledge).toHaveBeenCalledWith({ ok: true, roomCode: "24680" });
  });

  it("rejects invalid options without creating a room", async () => {
    const socket = createSocket();
    const acknowledge = vi.fn();
    const createPracticeRoom = vi.fn();
    registerPracticeSocketEvents(socket, {
      io: {},
      refreshSocketUser: vi.fn(),
      createPracticeRoom,
      isUserInActiveRoom: () => false,
      leaveMatchmaking: vi.fn()
    });

    await socket.trigger("practice:start", { difficulty: "expert", playerColor: "red" }, acknowledge);

    expect(createPracticeRoom).not.toHaveBeenCalled();
    expect(acknowledge).toHaveBeenCalledWith(expect.objectContaining({ ok: false, code: "invalid_practice_options" }));
  });
});
