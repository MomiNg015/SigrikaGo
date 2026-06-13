import { describe, expect, it, vi } from "vitest";
import { registerMatchSocketEvents } from "./socketMatchEvents.js";

function createSocket(user = { id: "user-a" }) {
  const handlers = {};
  return {
    id: "socket-a",
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
    io: {},
    prisma: {},
    refreshSocketUser: vi.fn(),
    listWaitingPlayers: vi.fn(() => []),
    hasBlacklistBetween: vi.fn(async () => false),
    joinMatchmaking: vi.fn(() => null),
    leaveMatchmaking: vi.fn(),
    broadcastLobbyStats: vi.fn(),
    normalizeGameModeId: vi.fn(() => "standard"),
    now: vi.fn(() => 12345),
    ...overrides
  };
}

describe("socket match events", () => {
  it("registers matchmaking join and leave handlers", () => {
    const socket = createSocket();

    registerMatchSocketEvents(socket, createDeps());

    expect(socket.on).toHaveBeenCalledWith("match:join", expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith("match:leave", expect.any(Function));
  });

  it("refreshes the socket user before joining matchmaking", async () => {
    const socket = createSocket({ id: "fresh-user" });
    const deps = createDeps();
    deps.refreshSocketUser.mockImplementation(async (receivedSocket) => {
      receivedSocket.user = { id: "refreshed-user" };
    });

    registerMatchSocketEvents(socket, deps);
    await socket.trigger("match:join", { mode: "spark" });

    expect(deps.normalizeGameModeId).toHaveBeenCalledWith("spark");
    expect(deps.joinMatchmaking).toHaveBeenCalledWith(
      { user: { id: "refreshed-user" }, socketId: "socket-a", mode: "standard" },
      deps.io,
      expect.objectContaining({ canPair: expect.any(Function) })
    );
    expect(socket.emit).toHaveBeenCalledWith("match:waiting", { startedAt: 12345, mode: "standard" });
    expect(deps.broadcastLobbyStats).toHaveBeenCalledTimes(1);
  });

  it("excludes blacklisted waiting candidates from pairing", async () => {
    const socket = createSocket({ id: "current-user" });
    const blockedCandidate = { user: { id: "blocked-user" } };
    const allowedCandidate = { user: { id: "allowed-user" } };
    const deps = createDeps({
      listWaitingPlayers: vi.fn(() => [blockedCandidate, allowedCandidate]),
      hasBlacklistBetween: vi.fn(async ({ secondUserId }) => secondUserId === "blocked-user")
    });

    registerMatchSocketEvents(socket, deps);
    await socket.trigger("match:join");

    const options = deps.joinMatchmaking.mock.calls[0][2];
    expect(options.canPair(blockedCandidate)).toBe(false);
    expect(options.canPair(allowedCandidate)).toBe(true);
    expect(deps.hasBlacklistBetween).toHaveBeenCalledWith({
      prisma: deps.prisma,
      firstUserId: "current-user",
      secondUserId: "blocked-user"
    });
  });

  it("does not emit waiting when matchmaking creates a room", async () => {
    const socket = createSocket();
    const deps = createDeps({ joinMatchmaking: vi.fn(() => ({ code: "12345" })) });

    registerMatchSocketEvents(socket, deps);
    await socket.trigger("match:join");

    expect(socket.emit).not.toHaveBeenCalledWith("match:waiting", expect.any(Object));
    expect(deps.broadcastLobbyStats).toHaveBeenCalledTimes(1);
  });

  it("emits the existing auth-expired toast when join refresh fails", async () => {
    const socket = createSocket();
    const deps = createDeps({
      refreshSocketUser: vi.fn(async () => {
        throw new Error("unauthorized");
      })
    });

    registerMatchSocketEvents(socket, deps);
    await socket.trigger("match:join");

    expect(deps.joinMatchmaking).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith("error:toast", expect.any(String));
  });

  it("leaves matchmaking and refreshes lobby stats", () => {
    const socket = createSocket({ id: "leaving-user" });
    const deps = createDeps();

    registerMatchSocketEvents(socket, deps);
    socket.trigger("match:leave");

    expect(deps.leaveMatchmaking).toHaveBeenCalledWith("leaving-user");
    expect(socket.emit).toHaveBeenCalledWith("match:left");
    expect(deps.broadcastLobbyStats).toHaveBeenCalledTimes(1);
  });
});
