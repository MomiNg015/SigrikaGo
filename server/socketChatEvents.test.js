import { describe, expect, it, vi } from "vitest";
import { registerChatSocketEvents } from "./socketChatEvents.js";

function createSocket(user = { id: "user-a" }) {
  const handlers = {};
  return {
    user,
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
    }),
    trigger: (event, payload) => handlers[event](payload)
  };
}

function createDeps(overrides = {}) {
  const room = { code: "12345" };
  const message = { id: "chat-1", type: "chat", text: "hello" };
  return {
    io: {},
    addChat: vi.fn(() => ({ room, message })),
    broadcastRoom: vi.fn(),
    broadcastRoomPatch: vi.fn(),
    ...overrides
  };
}

describe("socket chat events", () => {
  it("registers the chat send handler", () => {
    const socket = createSocket();

    registerChatSocketEvents(socket, createDeps());

    expect(socket.on).toHaveBeenCalledWith("chat:send", expect.any(Function));
  });

  it("forwards chat payloads with the current socket user and broadcasts chat patches", () => {
    const socket = createSocket({ id: "chat-user", username: "Chat User" });
    const room = { code: "12345" };
    const message = { id: "chat-1", type: "chat", text: "hello" };
    const deps = createDeps({ addChat: vi.fn(() => ({ room, message })) });

    registerChatSocketEvents(socket, deps);
    socket.trigger("chat:send", { roomCode: "12345", text: "hello" });

    expect(deps.addChat).toHaveBeenCalledWith("12345", socket.user, "hello");
    expect(deps.broadcastRoomPatch).toHaveBeenCalledWith(deps.io, room, {
      type: "chat:append",
      message
    }, { forcePersist: false });
    expect(deps.broadcastRoom).not.toHaveBeenCalled();
  });

  it("does not broadcast when chat mutation returns no room", () => {
    const socket = createSocket();
    const deps = createDeps({ addChat: vi.fn(() => null) });

    registerChatSocketEvents(socket, deps);
    socket.trigger("chat:send", { roomCode: "bad", text: "" });

    expect(deps.broadcastRoom).not.toHaveBeenCalled();
    expect(deps.broadcastRoomPatch).not.toHaveBeenCalled();
  });

  it("falls back to full room broadcasts for legacy chat mutations", () => {
    const socket = createSocket();
    const room = { code: "12345" };
    const deps = createDeps({ addChat: vi.fn(() => room), broadcastRoomPatch: null });

    registerChatSocketEvents(socket, deps);
    socket.trigger("chat:send", { roomCode: "12345", text: "hello" });

    expect(deps.broadcastRoom).toHaveBeenCalledWith(deps.io, room);
  });
});
