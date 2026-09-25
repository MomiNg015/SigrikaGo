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
    trigger: (event, ...args) => handlers[event](...args)
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
    runtimeServiceState: { admission: vi.fn(() => ({ ok: true })) },
    metrics: { increment: vi.fn() },
    now: vi.fn(() => 12345),
    ...overrides
  };
}

describe("socket match events", () => {
  it("does not requeue a match cancelled while admission is awaiting user refresh", async () => {
    let finishRefresh;
    const deps = createDeps({ refreshSocketUser: () => new Promise((resolve) => { finishRefresh = resolve; }) });
    const socket = createSocket();
    registerMatchSocketEvents(socket, deps);
    const pending = socket.trigger("match:join");
    socket.trigger("match:leave");
    finishRefresh();
    await pending;
    expect(deps.joinMatchmaking).not.toHaveBeenCalled();
  });

  it("rejects unavailable team lineups before queue admission and acknowledges the reason", async () => {
    const socket = createSocket({ id: "team-a", ownedCharacters: ["sigrika", "aemeath"] });
    const deps = createDeps({ normalizeGameModeId: () => "team", characterSelectionData: async () => ({}) });
    const ack = vi.fn();
    registerMatchSocketEvents(socket, deps);
    await socket.trigger("match:join", { mode: "team", lineup: ["sigrika", "aemeath", "nabomo"] }, ack);
    expect(ack).toHaveBeenCalledWith({ ok: false, error: "需要至少拥有3名部员才能参加" });
    expect(deps.joinMatchmaking).not.toHaveBeenCalled();
  });

  it("revalidates a waiting opponent's ownership before pairing team lineups", async () => {
    const lineup = ["sigrika", "aemeath", "nabomo"];
    const socket = createSocket({ id: "team-a", ownedCharacters: lineup });
    const waitingSocket = createSocket({ id: "team-b", ownedCharacters: lineup });
    const candidate = { mode: "team", socketId: "socket-b", user: waitingSocket.user, teamLineup: lineup.map((characterId) => ({ characterId })) };
    const deps = createDeps({
      io: { sockets: { sockets: new Map([["socket-b", waitingSocket]]) } },
      normalizeGameModeId: () => "team", characterSelectionData: async () => ({}),
      listWaitingPlayers: () => [candidate],
      refreshSocketUser: async (target) => { if (target === waitingSocket) target.user = { ...target.user, ownedCharacters: ["sigrika"] }; }
    });
    registerMatchSocketEvents(socket, deps);
    await socket.trigger("match:join", { mode: "team", lineup });
    expect(deps.leaveMatchmaking).toHaveBeenCalledWith("team-b");
    expect(waitingSocket.emit).toHaveBeenCalledWith("match:left");
    expect(deps.joinMatchmaking.mock.calls[0][0].teamLineup.map((entry) => entry.characterId)).toEqual(lineup);
  });

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

  it("rejects new matchmaking while the service is over its soft capacity", async () => {
    const socket = createSocket();
    const deps = createDeps({
      runtimeServiceState: { admission: vi.fn(() => ({ ok: false, error: "busy" })) }
    });

    registerMatchSocketEvents(socket, deps);
    await socket.trigger("match:join");

    expect(deps.joinMatchmaking).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith("error:toast", "busy");
    expect(deps.metrics.increment).toHaveBeenCalledWith("admissionRejectedMatches");
  });
});
