import { describe, expect, it, vi } from "vitest";
import { registerDisconnectSocketEvents } from "./socketDisconnectEvents.js";

function createSocket() {
  const handlers = {};
  return {
    id: "socket-a",
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
    }),
    trigger: (event) => handlers[event]()
  };
}

function createDeps(overrides = {}) {
  return {
    io: {},
    unregisterOnlineSocket: vi.fn(),
    detachSocket: vi.fn(() => []),
    broadcastRoom: vi.fn(),
    broadcastLobbyStats: vi.fn(),
    ...overrides
  };
}

describe("socket disconnect events", () => {
  it("registers the disconnect handler", () => {
    const socket = createSocket();

    registerDisconnectSocketEvents(socket, createDeps());

    expect(socket.on).toHaveBeenCalledWith("disconnect", expect.any(Function));
  });

  it("unregisters the socket, detaches rooms, broadcasts each changed room, and refreshes lobby stats", () => {
    const socket = createSocket();
    const rooms = [{ code: "11111" }, { code: "22222" }];
    const deps = createDeps({ detachSocket: vi.fn(() => rooms) });

    registerDisconnectSocketEvents(socket, deps);
    socket.trigger("disconnect");

    expect(deps.unregisterOnlineSocket).toHaveBeenCalledWith(socket);
    expect(deps.detachSocket).toHaveBeenCalledWith("socket-a", deps.io);
    expect(deps.broadcastRoom).toHaveBeenNthCalledWith(1, deps.io, rooms[0]);
    expect(deps.broadcastRoom).toHaveBeenNthCalledWith(2, deps.io, rooms[1]);
    expect(deps.broadcastLobbyStats).toHaveBeenCalledTimes(1);
  });

  it("refreshes lobby stats even when no rooms changed", () => {
    const socket = createSocket();
    const deps = createDeps({ detachSocket: vi.fn(() => []) });

    registerDisconnectSocketEvents(socket, deps);
    socket.trigger("disconnect");

    expect(deps.broadcastRoom).not.toHaveBeenCalled();
    expect(deps.broadcastLobbyStats).toHaveBeenCalledTimes(1);
  });
});
