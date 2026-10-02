import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { closeRealtimeServer, installServerLifecycle, startHttpServer } from "./serverLifecycle.js";

describe("server lifecycle", () => {
  it("reports an occupied port with a clear message and exits", () => {
    const server = new EventEmitter();
    server.listen = vi.fn();
    const logger = { error: vi.fn(), log: vi.fn() };
    const processLike = { exit: vi.fn(), on: vi.fn() };

    startHttpServer(server, { port: 3001, logger, processLike });
    server.emit("error", Object.assign(new Error("busy"), { code: "EADDRINUSE" }));

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("3001"));
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("already in use"));
    expect(processLike.exit).toHaveBeenCalledWith(1);
  });

  it("drains, closes realtime and HTTP, flushes, then disconnects dependencies", async () => {
    const order = [];
    const signalHandlers = new Map();
    const server = {
      close: vi.fn((callback) => {
        order.push("close");
        callback();
      })
    };
    const beforeShutdown = vi.fn(async () => order.push("flush"));
    const beginShutdown = vi.fn(async () => order.push("drain"));
    const closeRealtime = vi.fn(async () => order.push("realtime"));
    const dependency = { $disconnect: vi.fn(async () => order.push("disconnect")) };
    const processLike = {
      on: vi.fn((signal, handler) => signalHandlers.set(signal, handler)),
      exit: vi.fn()
    };

    installServerLifecycle(server, {
      processLike,
      beginShutdown: [beginShutdown],
      closeRealtime,
      beforeShutdown: [beforeShutdown],
      dependencies: [dependency]
    });
    await signalHandlers.get("SIGTERM")();

    expect(server.close).toHaveBeenCalledOnce();
    expect(beforeShutdown).toHaveBeenCalledOnce();
    expect(dependency.$disconnect).toHaveBeenCalledOnce();
    expect(order).toEqual(["drain", "realtime", "close", "flush", "disconnect"]);
    expect(processLike.exit).toHaveBeenCalledWith(0);
  });

  it("closes a Socket.IO-compatible realtime server through its callback", async () => {
    const realtimeServer = { close: vi.fn((callback) => callback()) };
    await closeRealtimeServer(realtimeServer);
    expect(realtimeServer.close).toHaveBeenCalledOnce();
  });

  it("exits unsuccessfully when graceful shutdown exceeds its deadline", async () => {
    vi.useFakeTimers();
    const signalHandlers = new Map();
    const processLike = {
      on: vi.fn((signal, handler) => signalHandlers.set(signal, handler)),
      exit: vi.fn()
    };
    const logger = { error: vi.fn() };
    const pending = new Promise(() => {});
    installServerLifecycle({ close: vi.fn() }, {
      processLike,
      beginShutdown: [() => pending],
      logger,
      shutdownTimeoutMs: 50
    });

    const shutdown = signalHandlers.get("SIGTERM")();
    await vi.advanceTimersByTimeAsync(50);
    await shutdown;

    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("50ms") }));
    expect(processLike.exit).toHaveBeenCalledWith(1);
    vi.useRealTimers();
  });
});
