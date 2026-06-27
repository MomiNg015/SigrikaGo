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
      broadcastRoomPresencePatch: vi.fn(),
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
      onError: expect.any(Function)
    });
  });

  test("increments runtime metrics when room persistence fails", () => {
    const error = new Error("db busy");
    const metrics = { increment: vi.fn() };
    const onPersistError = vi.fn();
    const persistRoomState = vi.fn(({ onError }) => onError(error));
    const runtime = createRoomRuntime({
      prisma: "prisma",
      persistRoomState,
      broadcastRoomUpdate: vi.fn(),
      broadcastRoomPatch: vi.fn(),
      broadcastRoomPresencePatch: vi.fn(),
      broadcastRoomToast: vi.fn(),
      throttleMs: 5000,
      metrics,
      onPersistError
    });

    runtime.persistRoom({ code: "12345" });

    expect(metrics.increment).toHaveBeenCalledWith("roomPersistenceErrors");
    expect(onPersistError).toHaveBeenCalledWith(error);
  });

  test("defaults persist force to false", () => {
    const persistRoomState = vi.fn();
    const runtime = createRoomRuntime({
      prisma: "prisma",
      persistRoomState,
      broadcastRoomUpdate: vi.fn(),
      broadcastRoomPatch: vi.fn(),
      broadcastRoomPresencePatch: vi.fn(),
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
      broadcastRoomPresencePatch: vi.fn(),
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
      broadcastRoomPresencePatch: vi.fn(),
      broadcastRoomToast: vi.fn(),
      throttleMs: 5000
    });
    const room = { code: "12345" };
    const patch = { type: "chat:append", message: { id: "chat-1" } };

    runtime.broadcastRoomPatch("io", room, patch);

    expect(broadcastRoomPatch).toHaveBeenCalledWith("io", room, patch, {
      forcePersist: true,
      persistRoom: runtime.persistRoom
    });
  });

  test("passes throttled patch persistence through the broadcast boundary", () => {
    const broadcastRoomPatch = vi.fn();
    const runtime = createRoomRuntime({
      prisma: "prisma",
      persistRoomState: vi.fn(),
      broadcastRoomUpdate: vi.fn(),
      broadcastRoomPatch,
      broadcastRoomPresencePatch: vi.fn(),
      broadcastRoomToast: vi.fn(),
      throttleMs: 5000
    });
    const room = { code: "12345" };
    const patch = { type: "chat:append", message: { id: "chat-1" } };

    runtime.broadcastRoomPatch("io", room, patch, { forcePersist: false });

    expect(broadcastRoomPatch).toHaveBeenCalledWith("io", room, patch, {
      forcePersist: false,
      persistRoom: runtime.persistRoom
    });
  });

  test("broadcasts room presence patches with the runtime persist callback", () => {
    const broadcastRoomPresencePatch = vi.fn();
    const runtime = createRoomRuntime({
      prisma: "prisma",
      persistRoomState: vi.fn(),
      broadcastRoomUpdate: vi.fn(),
      broadcastRoomPatch: vi.fn(),
      broadcastRoomPresencePatch,
      broadcastRoomToast: vi.fn(),
      throttleMs: 5000
    });
    const room = { code: "12345" };

    runtime.broadcastRoomPresencePatch("io", room);

    expect(broadcastRoomPresencePatch).toHaveBeenCalledWith("io", room, {
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
      broadcastRoomPresencePatch: vi.fn(),
      broadcastRoomToast,
      throttleMs: 5000
    });

    runtime.broadcastToast("io", { code: "12345" }, "hello");

    expect(broadcastRoomToast).toHaveBeenCalledWith("io", { code: "12345" }, "hello");
  });
});
