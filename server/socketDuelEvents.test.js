import { describe, expect, it, vi } from "vitest";
import { registerDuelSocketEvents } from "./socketDuelEvents.js";

function createSocket(user = { id: "user-a" }) {
  const handlers = {};
  return {
    user,
    emit: vi.fn(),
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
    }),
    trigger: (event, payload) => handlers[event](payload)
  };
}

function createDeps(overrides = {}) {
  return {
    refreshSocketUser: vi.fn(),
    duelRequests: {
      handleRequest: vi.fn(),
      handleResponse: vi.fn()
    },
    normalizeGameModeId: vi.fn(() => "standard"),
    broadcastLobbyStats: vi.fn(),
    ...overrides
  };
}

describe("socket duel events", () => {
  it("registers duel request and response handlers", () => {
    const socket = createSocket();

    registerDuelSocketEvents(socket, createDeps());

    expect(socket.on).toHaveBeenCalledWith("duel:request", expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith("duel:respond", expect.any(Function));
  });

  it("refreshes the socket user before forwarding duel requests", async () => {
    const socket = createSocket();
    const deps = createDeps();

    registerDuelSocketEvents(socket, deps);
    await socket.trigger("duel:request", { targetUserId: 123, mode: "spark" });

    expect(deps.refreshSocketUser).toHaveBeenCalledWith(socket);
    expect(deps.normalizeGameModeId).toHaveBeenCalledWith("spark");
    expect(deps.duelRequests.handleRequest).toHaveBeenCalledWith(socket, "123", "standard");
    expect(deps.broadcastLobbyStats).not.toHaveBeenCalled();
  });

  it("emits the existing auth-expired toast when duel request refresh fails", async () => {
    const socket = createSocket();
    const deps = createDeps({
      refreshSocketUser: vi.fn(async () => {
        throw new Error("unauthorized");
      })
    });

    registerDuelSocketEvents(socket, deps);
    await socket.trigger("duel:request", { targetUserId: "target" });

    expect(deps.duelRequests.handleRequest).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith("error:toast", expect.any(String));
  });

  it("refreshes the socket user before forwarding duel responses and refreshes lobby stats", async () => {
    const socket = createSocket();
    const deps = createDeps();

    registerDuelSocketEvents(socket, deps);
    await socket.trigger("duel:respond", { requestId: 456, accepted: 1 });

    expect(deps.refreshSocketUser).toHaveBeenCalledWith(socket);
    expect(deps.duelRequests.handleResponse).toHaveBeenCalledWith(socket, "456", true);
    expect(deps.broadcastLobbyStats).toHaveBeenCalledTimes(1);
  });

  it("emits the existing auth-expired toast and skips lobby stats when duel response fails", async () => {
    const socket = createSocket();
    const deps = createDeps({
      duelRequests: {
        handleRequest: vi.fn(),
        handleResponse: vi.fn(async () => {
          throw new Error("unauthorized");
        })
      }
    });

    registerDuelSocketEvents(socket, deps);
    await socket.trigger("duel:respond", { requestId: "request-a", accepted: true });

    expect(socket.emit).toHaveBeenCalledWith("error:toast", expect.any(String));
    expect(deps.broadcastLobbyStats).not.toHaveBeenCalled();
  });
});
