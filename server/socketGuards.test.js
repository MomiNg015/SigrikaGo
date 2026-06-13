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
    expect(socket.emit).toHaveBeenCalledWith("error:toast", expect.any(String));
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
    expect(socket.data.rateGuard.count).toBe(1);
  });
});
