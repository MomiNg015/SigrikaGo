import { describe, expect, test, vi } from "vitest";
import { createRoomRuntime } from "./roomRuntime.js";

describe("room runtime", () => {
  test("persists rooms with shared prisma, throttle, force flag, and error handler", () => {
    const prisma = {};
    const room = { code: "12345" };
    const persistRoomState = vi.fn();
    const onPersistError = vi.fn();
    const runtime = createRoomRuntime({
      prisma,
      persistRoomState,
      broadcastRoomUpdate: vi.fn(),
      broadcastRoomPatch: vi.fn(),
      broadcastRoomToast: vi.fn(),
      throttleMs: 5000,
      onPersistError
    });

    runtime.persistRoom(room, { force: true });

    expect(persistRoomState).toHaveBeenCalledWith({
      prisma,
      room,
      force: true,
      throttleMs: 5000,
      onError: onPersistError
    });
  });

  test("defaults persist force to false", () => {
    const persistRoomState = vi.fn();
    const runtime = createRoomRuntime({
      prisma: "prisma",
      persistRoomState,
      broadcastRoomUpdate: vi.fn(),
      broadcastRoomPatch: vi.fn(),
      broadcastRoomToast: vi.fn(),
      throttleMs: 5000
    });

    runtime.persistRoom({ code: "12345" });

    expect(persistRoomState).toHaveBeenCalledWith(expect.objectContaining({
      force: false
    }));
  });

  test("broadcasts room updates with the runtime persist callback", () => {
    const broadcastRoomUpdate = vi.fn();
    const runtime = createRoomRuntime({
      prisma: "prisma",
      persistRoomState: vi.fn(),
      broadcastRoomUpdate,
      broadcastRoomPatch: vi.fn(),
      broadcastRoomToast: vi.fn(),
      throttleMs: 5000
    });
    const room = { code: "12345" };

    runtime.broadcastRoom("io", room);

    expect(broadcastRoomUpdate).toHaveBeenCalledWith("io", room, {
      persistRoom: runtime.persistRoom
    });
  });

  test("broadcasts room patches with the runtime persist callback", () => {
    const broadcastRoomPatch = vi.fn();
    const runtime = createRoomRuntime({
      prisma: "prisma",
      persistRoomState: vi.fn(),
      broadcastRoomUpdate: vi.fn(),
      broadcastRoomPatch,
      broadcastRoomToast: vi.fn(),
      throttleMs: 5000
    });
    const room = { code: "12345" };
    const patch = { type: "chat:append", message: { id: "chat-1" } };

    runtime.broadcastRoomPatch("io", room, patch);

    expect(broadcastRoomPatch).toHaveBeenCalledWith("io", room, patch, {
      persistRoom: runtime.persistRoom
    });
  });

  test("forwards room toasts through the broadcast boundary", () => {
    const broadcastRoomToast = vi.fn();
    const runtime = createRoomRuntime({
      prisma: "prisma",
      persistRoomState: vi.fn(),
      broadcastRoomUpdate: vi.fn(),
      broadcastRoomPatch: vi.fn(),
      broadcastRoomToast,
      throttleMs: 5000
    });

    runtime.broadcastToast("io", { code: "12345" }, "hello");

    expect(broadcastRoomToast).toHaveBeenCalledWith("io", { code: "12345" }, "hello");
  });
});
