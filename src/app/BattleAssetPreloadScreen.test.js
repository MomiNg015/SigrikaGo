import { afterEach, describe, expect, it, vi } from "vitest";
import { createPreloadReadyReporter } from "./BattleAssetPreloadScreen.jsx";

describe("battle preload ready reporting", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries room:preload-ready until the server acknowledges it", () => {
    vi.useFakeTimers();
    const listeners = new Map();
    const socket = {
      emit: vi.fn((_event, _payload, ack) => {
        if (socket.emit.mock.calls.length === 2) ack({ ok: true, roomCode: "12345" });
      }),
      off: vi.fn((event) => listeners.delete(event)),
      on: vi.fn((event, callback) => listeners.set(event, callback))
    };
    const onAcknowledged = vi.fn();

    const cancel = createPreloadReadyReporter({
      onAcknowledged,
      retryDelaysMs: [100, 200],
      roomCode: "12345",
      socket
    });

    expect(socket.emit).toHaveBeenCalledWith("room:preload-ready", { roomCode: "12345" }, expect.any(Function));
    vi.advanceTimersByTime(100);

    expect(socket.emit).toHaveBeenCalledTimes(2);
    expect(onAcknowledged).toHaveBeenCalledWith({ ok: true, roomCode: "12345" });

    vi.advanceTimersByTime(200);
    expect(socket.emit).toHaveBeenCalledTimes(2);

    cancel();
    expect(socket.off).toHaveBeenCalledWith("connect", expect.any(Function));
  });

  it("resends preload-ready immediately when the socket reconnects before ack", () => {
    vi.useFakeTimers();
    const listeners = new Map();
    const socket = {
      emit: vi.fn(),
      off: vi.fn((event) => listeners.delete(event)),
      on: vi.fn((event, callback) => listeners.set(event, callback))
    };

    createPreloadReadyReporter({
      retryDelaysMs: [5000],
      roomCode: "12345",
      socket
    });
    listeners.get("connect")();

    expect(socket.emit).toHaveBeenCalledTimes(2);
    expect(socket.emit).toHaveBeenLastCalledWith("room:preload-ready", { roomCode: "12345" }, expect.any(Function));
  });
});
