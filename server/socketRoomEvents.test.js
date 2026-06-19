import { describe, expect, it, vi } from "vitest";
import { registerRoomSocketEvents } from "./socketRoomEvents.js";

function createSocket(user = { id: "user-a" }) {
  const handlers = {};
  return {
    id: "socket-a",
    user,
    emit: vi.fn(),
    leave: vi.fn(),
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
    validateRoomCode: vi.fn((roomCode) => ({ ok: true, value: roomCode })),
    validateOptionalRoomCode: vi.fn((roomCode) => roomCode ?? null),
    attachSocketToRoom: vi.fn(() => ({ code: "12345" })),
    leaveRoom: vi.fn(() => ({ code: "12345" })),
    findRoomForUser: vi.fn(),
    resumePayloadForUser: vi.fn(async () => ({ type: "none" })),
    roomView: vi.fn((room, viewerId) => ({ code: room.code, viewerId })),
    broadcastRoom: vi.fn(),
    broadcastRoomPresencePatch: vi.fn(),
    ...overrides
  };
}

describe("socket room events", () => {
  it("registers room connection handlers", () => {
    const socket = createSocket();

    registerRoomSocketEvents(socket, createDeps());

    expect(socket.on).toHaveBeenCalledWith("room:join", expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith("room:leave", expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith("room:resume", expect.any(Function));
  });

  it("emits a toast and skips attach when join receives an invalid room code", () => {
    const socket = createSocket();
    const deps = createDeps({
      validateRoomCode: vi.fn(() => ({ ok: false, error: "bad room code" }))
    });

    registerRoomSocketEvents(socket, deps);
    socket.trigger("room:join", { roomCode: "abc" });

    expect(socket.emit).toHaveBeenCalledWith("error:toast", "bad room code");
    expect(deps.attachSocketToRoom).not.toHaveBeenCalled();
    expect(deps.broadcastRoom).not.toHaveBeenCalled();
    expect(deps.broadcastRoomPresencePatch).not.toHaveBeenCalled();
  });

  it("emits the existing room-unavailable toast when join cannot attach", () => {
    const socket = createSocket();
    const deps = createDeps({ attachSocketToRoom: vi.fn(() => null) });

    registerRoomSocketEvents(socket, deps);
    socket.trigger("room:join", { roomCode: "12345" });

    expect(deps.attachSocketToRoom).toHaveBeenCalledWith("12345", socket, socket.user);
    expect(socket.emit).toHaveBeenCalledWith("error:toast", expect.any(String));
    expect(deps.broadcastRoom).not.toHaveBeenCalled();
    expect(deps.broadcastRoomPresencePatch).not.toHaveBeenCalled();
  });

  it("emits the viewer room update and broadcasts a presence patch after a successful join", () => {
    const socket = createSocket({ id: "viewer-a" });
    const room = { code: "12345" };
    const deps = createDeps({ attachSocketToRoom: vi.fn(() => room) });

    registerRoomSocketEvents(socket, deps);
    socket.trigger("room:join", { roomCode: "12345" });

    expect(socket.emit).toHaveBeenCalledWith("room:update", { code: "12345", viewerId: "viewer-a" });
    expect(deps.broadcastRoomPresencePatch).toHaveBeenCalledWith(deps.io, room);
    expect(deps.broadcastRoom).not.toHaveBeenCalledWith(deps.io, room);
  });

  it("leaves a room, emits room:left, and broadcasts changed presence", () => {
    const socket = createSocket({ id: "leaving-user" });
    const room = { code: "54321" };
    const deps = createDeps({ leaveRoom: vi.fn(() => room) });

    registerRoomSocketEvents(socket, deps);
    socket.trigger("room:leave", { roomCode: "54321" });

    expect(deps.leaveRoom).toHaveBeenCalledWith("54321", "leaving-user", "socket-a");
    expect(socket.leave).toHaveBeenCalledWith("54321");
    expect(socket.emit).toHaveBeenCalledWith("room:left", { roomCode: "54321" });
    expect(deps.broadcastRoomPresencePatch).toHaveBeenCalledWith(deps.io, room);
    expect(deps.broadcastRoom).not.toHaveBeenCalledWith(deps.io, room);
  });

  it("does nothing when leaveRoom reports no changed room", () => {
    const socket = createSocket();
    const deps = createDeps({ leaveRoom: vi.fn(() => null) });

    registerRoomSocketEvents(socket, deps);
    socket.trigger("room:leave", { roomCode: "54321" });

    expect(socket.leave).not.toHaveBeenCalled();
    expect(socket.emit).not.toHaveBeenCalled();
    expect(deps.broadcastRoom).not.toHaveBeenCalled();
    expect(deps.broadcastRoomPresencePatch).not.toHaveBeenCalled();
  });

  it("attaches and broadcasts a resumable room presence payload", async () => {
    const socket = createSocket({ id: "resume-user" });
    const room = { code: "67890" };
    const deps = createDeps({
      resumePayloadForUser: vi.fn(async () => ({ type: "room", room: { code: "67890" } })),
      attachSocketToRoom: vi.fn(() => room)
    });

    registerRoomSocketEvents(socket, deps);
    await socket.trigger("room:resume", { roomCode: "67890" });

    expect(deps.validateOptionalRoomCode).toHaveBeenCalledWith("67890");
    expect(deps.resumePayloadForUser).toHaveBeenCalledWith({
      prisma: deps.prisma,
      userId: "resume-user",
      roomCode: "67890",
      findRoomForUser: deps.findRoomForUser,
      roomView: deps.roomView
    });
    expect(deps.attachSocketToRoom).toHaveBeenCalledWith("67890", socket, socket.user);
    expect(socket.emit).toHaveBeenCalledWith("room:update", { code: "67890", viewerId: "resume-user" });
    expect(deps.broadcastRoomPresencePatch).toHaveBeenCalledWith(deps.io, room);
    expect(deps.broadcastRoom).not.toHaveBeenCalledWith(deps.io, room);
    expect(socket.emit).not.toHaveBeenCalledWith("room:resume", expect.any(Object));
  });

  it("emits the resume payload when no room can be attached", async () => {
    const socket = createSocket();
    const payload = { type: "lobby" };
    const deps = createDeps({ resumePayloadForUser: vi.fn(async () => payload) });

    registerRoomSocketEvents(socket, deps);
    await socket.trigger("room:resume");

    expect(socket.emit).toHaveBeenCalledWith("room:resume", payload);
    expect(deps.broadcastRoom).not.toHaveBeenCalled();
    expect(deps.broadcastRoomPresencePatch).not.toHaveBeenCalled();
  });
});
