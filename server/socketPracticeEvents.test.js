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

  it.each(["beginner", "intermediate", "advanced"])("accepts the public %s difficulty", async (difficulty) => {
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

    await socket.trigger("practice:start", { difficulty, playerColor: "random" }, acknowledge);

    expect(createPracticeRoom).toHaveBeenCalledWith(
      expect.anything(),
      {},
      { difficulty, playerColor: "random" }
    );
  });

  it("rejects the legacy basic alias for new rooms", async () => {
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

    await socket.trigger("practice:start", { difficulty: "basic", playerColor: "random" }, acknowledge);

    expect(createPracticeRoom).not.toHaveBeenCalled();
    expect(acknowledge).toHaveBeenCalledWith(expect.objectContaining({ code: "invalid_practice_options" }));
  });

  it("refuses to create a room when GNU Go is unavailable", async () => {
    const socket = createSocket();
    const acknowledge = vi.fn();
    const createPracticeRoom = vi.fn();
    const leaveMatchmaking = vi.fn();
    registerPracticeSocketEvents(socket, {
      io: {},
      refreshSocketUser: vi.fn(),
      createPracticeRoom,
      isUserInActiveRoom: () => false,
      leaveMatchmaking,
      practiceEngineReady: vi.fn().mockResolvedValue({ ok: false })
    });

    await socket.trigger(
      "practice:start",
      { difficulty: "advanced", playerColor: "random" },
      acknowledge
    );

    expect(createPracticeRoom).not.toHaveBeenCalled();
    expect(leaveMatchmaking).not.toHaveBeenCalled();
    expect(acknowledge).toHaveBeenCalledWith({
      ok: false,
      error: "准时宝的 GNU Go 引擎暂时不可用，请联系管理员",
      code: "practice_engine_unavailable"
    });
  });
});
