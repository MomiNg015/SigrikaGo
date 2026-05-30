import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { installServerLifecycle, startHttpServer } from "./serverLifecycle.js";

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

  it("closes the server and disconnects dependencies on shutdown signals", async () => {
    const signalHandlers = new Map();
    const server = {
      close: vi.fn((callback) => callback())
    };
    const dependency = { $disconnect: vi.fn(async () => {}) };
    const processLike = {
      on: vi.fn((signal, handler) => signalHandlers.set(signal, handler)),
      exit: vi.fn()
    };

    installServerLifecycle(server, { processLike, dependencies: [dependency] });
    await signalHandlers.get("SIGTERM")();

    expect(server.close).toHaveBeenCalledOnce();
    expect(dependency.$disconnect).toHaveBeenCalledOnce();
    expect(processLike.exit).toHaveBeenCalledWith(0);
  });
});
