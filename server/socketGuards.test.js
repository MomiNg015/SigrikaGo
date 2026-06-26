import { describe, expect, it, vi } from "vitest";
import { installSocketRateGuard } from "./socketGuards.js";

function createSocket() {
  return {
    data: {},
    emit: vi.fn(),
    use: vi.fn((handler) => {
      createSocket.middleware = handler;
    })
  };
}

describe("socket guards", () => {
  it("allows packets through the configured window limit", () => {
    let now = 1000;
    const socket = createSocket();
    installSocketRateGuard(socket, { now: () => now });
    const middleware = createSocket.middleware;
    const next = vi.fn();

    for (let index = 0; index < 120; index += 1) {
      middleware([], next);
    }

    expect(next).toHaveBeenCalledTimes(120);
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it("emits an error toast instead of calling next after the window limit", () => {
    let now = 1000;
    const socket = createSocket();
    installSocketRateGuard(socket, { now: () => now });
    const middleware = createSocket.middleware;
    const next = vi.fn();

    for (let index = 0; index < 121; index += 1) {
      middleware([], next);
    }

    expect(next).toHaveBeenCalledTimes(120);
    expect(socket.emit).toHaveBeenCalledWith("error:toast", "操作过于频繁，请稍后再试");
  });

  it("emits only one rate-limit toast per rate window", () => {
    let now = 1000;
    const socket = createSocket();
    installSocketRateGuard(socket, { now: () => now });
    const middleware = createSocket.middleware;
    const next = vi.fn();

    for (let index = 0; index < 123; index += 1) {
      middleware([], next);
    }

    expect(next).toHaveBeenCalledTimes(120);
    expect(socket.emit).toHaveBeenCalledTimes(1);
    now += 10001;
    for (let index = 0; index < 121; index += 1) {
      middleware([], next);
    }
    expect(socket.emit).toHaveBeenCalledTimes(2);
  });

  it("resets the count after the rate window elapses", () => {
    let now = 1000;
    const socket = createSocket();
    installSocketRateGuard(socket, { now: () => now });
    const middleware = createSocket.middleware;
    const next = vi.fn();

    for (let index = 0; index < 120; index += 1) {
      middleware([], next);
    }
    now += 10001;
    middleware([], next);

    expect(next).toHaveBeenCalledTimes(121);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(socket.data.rateGuard.action.count).toBe(1);
  });

  it("does not show user-visible rate-limit toasts for room resume storms", () => {
    let now = 1000;
    const socket = createSocket();
    installSocketRateGuard(socket, { now: () => now });
    const middleware = createSocket.middleware;
    const next = vi.fn();
    const ack = vi.fn();

    for (let index = 0; index < 305; index += 1) {
      middleware(["room:resume", { roomCode: "12345" }, ack], next);
    }

    expect(next).toHaveBeenCalledTimes(300);
    expect(socket.emit).not.toHaveBeenCalledWith("error:toast", expect.any(String));
    expect(ack).toHaveBeenCalledWith({ ok: false, error: "too_many_recovery_requests" });
  });

  it("still shows rate-limit toasts for high-frequency game actions", () => {
    let now = 1000;
    const socket = createSocket();
    installSocketRateGuard(socket, { now: () => now });
    const middleware = createSocket.middleware;
    const next = vi.fn();

    for (let index = 0; index < 121; index += 1) {
      middleware(["game:action", { type: "pass" }], next);
    }

    expect(next).toHaveBeenCalledTimes(120);
    expect(socket.emit).toHaveBeenCalledWith("error:toast", "操作过于频繁，请稍后再试");
  });
});
