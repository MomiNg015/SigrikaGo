import { describe, expect, it, vi } from "vitest";
import { registerSocketEvents } from "./socketEvents.js";

function createSocket() {
  return {
    id: "socket-a",
    data: {},
    user: { id: "user-a" },
    emit: vi.fn(),
    leave: vi.fn(),
    on: vi.fn(),
    use: vi.fn()
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
    validateRoomCode: vi.fn((roomCode) => ({ ok: true, value: roomCode })),
    validateOptionalRoomCode: vi.fn((roomCode) => roomCode ?? null),
    attachSocketToRoom: vi.fn(() => ({ code: "12345" })),
    leaveRoom: vi.fn(() => ({ code: "12345" })),
    findRoomForUser: vi.fn(),
    resumePayloadForUser: vi.fn(async () => ({ type: "none" })),
    roomView: vi.fn((room, viewerId) => ({ code: room.code, viewerId })),
    handleGameAction: vi.fn(() => ({ ok: true, room: { code: "12345" } })),
    requestCounting: vi.fn(() => ({ ok: true, room: { code: "12345" } })),
    respondCounting: vi.fn(() => ({ ok: true, room: { code: "12345" } })),
    requestDraw: vi.fn(() => ({ ok: true, room: { code: "12345" } })),
    respondDraw: vi.fn(() => ({ ok: true, room: { code: "12345" } })),
    handleScoringAction: vi.fn(() => ({ ok: true, room: { code: "12345" } })),
    getRoom: vi.fn(() => null),
    addChat: vi.fn(() => null),
    duelRequests: {
      handleRequest: vi.fn(),
      handleResponse: vi.fn()
    },
    unregisterOnlineSocket: vi.fn(),
    detachSocket: vi.fn(() => []),
    broadcastRoom: vi.fn(),
    broadcastRoomPatch: vi.fn(),
    broadcastRoomPresencePatch: vi.fn(),
    markRoomPreloadReady: vi.fn(),
    metrics: { increment: vi.fn() },
    ...overrides
  };
}

describe("socket event registration", () => {
  it("installs the rate guard and registers every authenticated socket event group", () => {
    const socket = createSocket();

    registerSocketEvents(socket, createDeps());

    expect(socket.use).toHaveBeenCalledWith(expect.any(Function));
    expect(socket.data.rateGuard).toEqual({
      action: expect.objectContaining({ count: 0, notified: false }),
      recovery: expect.objectContaining({ count: 0, notified: false })
    });
    expect(socket.on.mock.calls.map(([event]) => event)).toEqual([
      "match:join",
      "match:leave",
      "room:join",
      "room:leave",
      "room:resume",
      "room:preload-ready",
      "game:action",
      "counting:request",
      "counting:respond",
      "draw:request",
      "draw:respond",
      "scoring:action",
      "chat:send",
      "duel:request",
      "duel:respond",
      "disconnect"
    ]);
  });

  it("routes chat sends to room patch broadcasts", () => {
    const socket = createSocket();
    const room = { code: "12345" };
    const message = { id: "chat-1", text: "hello" };
    const deps = createDeps({
      addChat: vi.fn(() => ({ room, message }))
    });

    registerSocketEvents(socket, deps);
    const chatHandler = socket.on.mock.calls.find(([event]) => event === "chat:send")[1];
    chatHandler({ roomCode: "12345", text: "hello" });

    expect(deps.broadcastRoomPatch).toHaveBeenCalledWith(deps.io, room, {
      type: "chat:append",
      message
    }, { forcePersist: false });
    expect(deps.broadcastRoom).not.toHaveBeenCalledWith(deps.io, room);
  });

  it("forwards runtime metrics into room recovery events", async () => {
    const socket = createSocket();
    const deps = createDeps();

    registerSocketEvents(socket, deps);
    const resumeHandler = socket.on.mock.calls.find(([event]) => event === "room:resume")[1];
    await resumeHandler({ roomCode: "12345", resumeReason: "socket-connect" });

    expect(deps.metrics.increment).toHaveBeenCalledWith("roomResumeAttempts");
    expect(deps.metrics.increment).toHaveBeenCalledWith("roomResumeSocketConnectRequests");
  });
});
